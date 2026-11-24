/**
 * Stackra file contract:
 * Purpose: the D1 migration gate of the box deploy path (STA-2783, ADR 0536 gate 3): splits a migration file into
 *   statements (comments and quoted text respected) and classifies each one. Only additive statements pass:
 *   `CREATE TABLE`, `CREATE [UNIQUE] INDEX`, `ALTER TABLE … ADD [COLUMN]`, `INSERT INTO` and `INSERT OR IGNORE INTO`
 *   (never `OR REPLACE`, `REPLACE INTO` or an upsert's `DO UPDATE`). Everything else (`DROP`, `DELETE`, `UPDATE`,
 *   `ALTER … DROP|RENAME`, `CREATE TRIGGER|VIEW|VIRTUAL TABLE`, `PRAGMA`, a `WITH` statement, anything unknown)
 *   stops the deploy and names the statement for the owner.
 * Boundary: pure; reads text only, runs nothing. A file it cannot split (an unterminated string or comment) is not
 *   additive.
 * Runtime: node
 * Governing contract: ADR 0536 (gate 3); ADR 0453 (the registry's numbered D1 migrations).
 */

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

/** What one statement is and whether it is additive. */
export function classifyStatement(statement) {
  const masked = maskedStatement(statement);
  const additive = ADDITIVE.find((rule) => rule.test(masked));
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
 * is; otherwise `blocking` names each file and statement that stops the deploy.
 */
export function migrationVerdict(files) {
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
      const verdict = classifyStatement(statement);
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
