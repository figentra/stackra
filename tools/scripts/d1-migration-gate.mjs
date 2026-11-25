#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the D1 migration gate (STA-2783, ADR 0536 gate 3), shared by the box deploy service and CI's Worker
 *   deploys: splits a migration file into statements (comments and quoted text respected) and classifies each one.
 *   Only additive statements pass: `CREATE TABLE`, `CREATE [UNIQUE] INDEX`, `ALTER TABLE … ADD [COLUMN]`, `INSERT
 *   INTO` and `INSERT OR IGNORE INTO` (never `OR REPLACE`, `REPLACE INTO` or an upsert's `DO UPDATE`). Everything else
 *   (`DROP`, `DELETE`, `UPDATE`, `ALTER … DROP|RENAME`, `CREATE TRIGGER|VIEW|VIRTUAL TABLE`, `PRAGMA`, a `WITH`
 *   statement, anything unknown) stops the deploy and names the statement for the owner. An additive `INSERT` into a
 *   table that grants publish, read or API rights (`ownerTables`; the registry's are REGISTRY_TRUST_TABLES) stops for
 *   the owner too: a new trusted publisher, scope, token, licence, grant or name rule is a trust change, not data.
 *   CLI, for a CI step before `wrangler d1 migrations apply` (or runway's driver, which can import the module):
 *     node tools/scripts/d1-migration-gate.mjs [--registry | --owner-tables a,b] <file.sql>...
 * Boundary: pure functions plus the CLI's file reads; runs nothing. A file it cannot split (an unterminated string or
 *   comment) is not additive.
 * Runtime: node
 * Governing contract: ADR 0536 (gate 3); ADR 0453 (the registry's numbered D1 migrations, decisions 6 and 10).
 * Exit: 0 every file passes, 1 a statement needs the owner, 2 usage.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The registry tables whose rows grant rights (workers/registry/migrations): trusted publishers, scopes and their read
 * rules, publish tokens, licences, licence grants and tokens, the licence API's issuer tokens, and per-name read
 * rules. An insert into any of them waits for the owner.
 */
export const REGISTRY_TRUST_TABLES = Object.freeze([
  "publishers",
  "scopes",
  "publish_tokens",
  "licences",
  "licence_grants",
  "licence_tokens",
  "issuer_tokens",
  "name_rules",
]);

/** The statements of a migration file, comments dropped, quoted text kept, empty statements left out. */
export function sqlStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  const push = () => {
    const text = current.trim();
    if (text !== "") statements.push(text);
    current = "";
  };
  while (i < sql.length) {
    const c = sql[i];
    const next = sql[i + 1];
    if (c === "-" && next === "-") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      current += " ";
      continue;
    }
    if (c === "/" && next === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) throw new SyntaxError("an unterminated /* comment");
      i = end + 2;
      current += " ";
      continue;
    }
    if (c === "'" || c === '"' || c === "`" || c === "[") {
      const close = c === "[" ? "]" : c;
      let j = i + 1;
      for (;;) {
        if (j >= sql.length) throw new SyntaxError(`an unterminated ${c} quote`);
        if (sql[j] === close) {
          // '' and "" escape their quote; ] and ` have no escape in SQLite identifiers here.
          if ((close === "'" || close === '"') && sql[j + 1] === close) {
            j += 2;
            continue;
          }
          break;
        }
        j += 1;
      }
      current += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === ";") {
      push();
      i += 1;
      continue;
    }
    current += c;
    i += 1;
  }
  push();
  return statements;
}

/** The statement with every quoted part emptied and whitespace collapsed, upper case: what the rules match. */
export function maskedStatement(statement) {
  return statement
    .replaceAll(/'(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`|\[[^\]]*\]/g, "''")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** The additive shapes, each with the kind it reports. */
const ADDITIVE = [
  { kind: "CREATE TABLE", test: (s) => /^CREATE TABLE (?:IF NOT EXISTS )?\S/.test(s) },
  { kind: "CREATE INDEX", test: (s) => /^CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?\S/.test(s) },
  {
    kind: "ALTER TABLE ADD COLUMN",
    test: (s) =>
      /^ALTER TABLE \S+ ADD (?:COLUMN )?\S/.test(s) && !/ ADD (?:COLUMN )?CONSTRAINT /.test(s),
  },
  {
    kind: "INSERT",
    test: (s) =>
      /^INSERT (?:OR IGNORE )?INTO \S/.test(s) && !/\bON CONFLICT\b[\s\S]*\bDO UPDATE\b/.test(s),
  },
];

/** The table an `INSERT` writes, unquoted and without a schema prefix, lower case; null for another statement. */
export function insertTable(statement) {
  const match =
    /^\s*INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(?:[\w"`[\]]+\.)?["`[]?([\w]+)["`\]]?/i.exec(statement);
  return match ? match[1].toLowerCase() : null;
}

/** What one statement is and whether it is additive; an insert into one of `ownerTables` is not. */
export function classifyStatement(statement, ownerTables = []) {
  const masked = maskedStatement(statement);
  const additive = ADDITIVE.find((rule) => rule.test(masked));
  const table = additive?.kind === "INSERT" ? insertTable(statement) : null;
  if (table !== null && ownerTables.includes(table))
    return {
      kind: `INSERT INTO ${table}`,
      additive: false,
      trust: true,
      statement: masked.slice(0, 120),
    };
  if (additive) return { kind: additive.kind, additive: true, statement: masked.slice(0, 120) };
  const words = masked.split(" ");
  const kind =
    /^(?:CREATE|ALTER|DROP)$/.test(words[0] ?? "") && words[1]
      ? `${words[0]} ${words[1]}`
      : words[0];
  return { kind: kind || "EMPTY", additive: false, statement: masked.slice(0, 120) };
}

/**
 * The verdict on a set of pending migration files (`[{ file, sql }]`): additive when every statement of every file
 * is (an insert into one of `ownerTables` is not); otherwise `blocking` names each file and statement that stops the
 * deploy.
 */
export function migrationVerdict(files, { ownerTables = [] } = {}) {
  const blocking = [];
  const kinds = [];
  for (const { file, sql } of files) {
    let statements;
    try {
      statements = sqlStatements(sql);
    } catch (error) {
      blocking.push({ file, kind: "UNPARSEABLE", statement: error.message });
      continue;
    }
    for (const statement of statements) {
      const verdict = classifyStatement(statement, ownerTables);
      kinds.push(verdict.kind);
      if (!verdict.additive)
        blocking.push({ file, kind: verdict.kind, statement: verdict.statement });
    }
  }
  return {
    additive: blocking.length === 0,
    files: files.map((f) => f.file),
    kinds: [...new Set(kinds)],
    blocking,
  };
}

/**
 * The pending migration names from `wrangler d1 migrations list <db> --remote`: none on "No migrations to apply",
 * the `NNNN_name.sql` names of its table otherwise. An output that says neither is an error, never "none".
 */
export function pendingMigrations(output) {
  const text = String(output);
  if (/No migrations to apply/i.test(text)) return [];
  if (!/Migrations to be applied/i.test(text))
    throw new Error("wrangler d1 migrations list printed neither pending migrations nor none");
  const names = [...text.matchAll(/\b(\d{4}_[\w.-]*?\.sql)\b/g)].map((m) => m[1]);
  if (names.length === 0)
    throw new Error("wrangler d1 migrations list named pending migrations but no file");
  return [...new Set(names)];
}

/** The CLI's options, or null on a usage error. */
export function parseGateArgs(argv) {
  const files = [];
  let ownerTables = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--registry") ownerTables = [...REGISTRY_TRUST_TABLES];
    else if (argv[i] === "--owner-tables")
      ownerTables = String(argv[(i += 1)] ?? "")
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean);
    else if (argv[i].startsWith("--")) return null;
    else files.push(argv[i]);
  }
  return files.length === 0 ? null : { files, ownerTables };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseGateArgs(process.argv.slice(2));
  if (options === null) {
    process.stderr.write(
      "usage: d1-migration-gate.mjs [--registry | --owner-tables a,b] <file.sql>...\n",
    );
    process.exitCode = 2;
  } else {
    const verdict = migrationVerdict(
      options.files.map((path) => ({ file: basename(path), sql: readFileSync(path, "utf8") })),
      { ownerTables: options.ownerTables },
    );
    for (const b of verdict.blocking)
      process.stdout.write(`needs the owner: ${b.file} ${b.kind}: ${b.statement}\n`);
    process.stdout.write(verdict.additive ? "every statement may run\n" : "");
    process.exitCode = verdict.additive ? 0 : 1;
  }
}
