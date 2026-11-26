/**
 * Stackra file contract:
 * Purpose: hold the D1 gate (d1-migration-gate.mjs, ADR 0536 gate 3, shared by the box and CI) to its contract: only additive
 *          statements pass, every destructive or unknown one stops the deploy, quoted text and comments never fool the
 *          split, and wrangler's pending-migration list is read fail-closed. Every migration of workers/registry is
 *          additive today.
 * Boundary: pure functions and the repository's own migration files; nothing runs.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0536; STA-2783.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  classifyStatement,
  insertTable,
  migrationVerdict,
  parseGateArgs,
  pendingMigrations,
  REGISTRY_TRUST_TABLES,
  sqlStatements,
} from "../d1-migration-gate.mjs";

const MIGRATIONS = fileURLToPath(new URL("../../../workers/registry/migrations/", import.meta.url));

test("the split keeps quoted semicolons and drops comments", () => {
  const sql = [
    "-- a comment; with a semicolon",
    "CREATE TABLE a (x TEXT DEFAULT 'a;b');",
    "/* DROP TABLE a; */",
    `INSERT INTO a (x) VALUES ('it''s; fine');`,
    'CREATE INDEX "i;dx" ON a (x)',
  ].join("\n");
  assert.deepEqual(sqlStatements(sql), [
    "CREATE TABLE a (x TEXT DEFAULT 'a;b')",
    "INSERT INTO a (x) VALUES ('it''s; fine')",
    'CREATE INDEX "i;dx" ON a (x)',
  ]);
});

test("an unterminated string or comment is not additive", () => {
  assert.throws(() => sqlStatements("INSERT INTO a VALUES ('x);"), /unterminated/);
  const verdict = migrationVerdict([{ file: "0099_bad.sql", sql: "CREATE TABLE a (x); /* DROP" }]);
  assert.equal(verdict.additive, false);
  assert.equal(verdict.blocking[0].kind, "UNPARSEABLE");
});

test("the additive shapes pass", () => {
  for (const statement of [
    "CREATE TABLE t (a TEXT)",
    "create table if not exists t (a text)",
    "CREATE INDEX t_a ON t (a)",
    "CREATE UNIQUE INDEX IF NOT EXISTS t_a ON t (a)",
    "ALTER TABLE t ADD COLUMN b TEXT",
    "ALTER TABLE t ADD b TEXT NOT NULL DEFAULT ''",
    "INSERT INTO t (a) VALUES ('x')",
    "INSERT OR IGNORE INTO t (a) VALUES ('x')",
    "INSERT INTO t (a) SELECT a FROM u",
    "INSERT INTO t (a) VALUES ('x') ON CONFLICT DO NOTHING",
  ])
    assert.equal(classifyStatement(statement).additive, true, statement);
});

test("every destructive or unknown statement stops", () => {
  const cases = {
    "DROP TABLE t": "DROP TABLE",
    "DROP INDEX t_a": "DROP INDEX",
    "DELETE FROM t": "DELETE",
    "UPDATE t SET a = 'x'": "UPDATE",
    "ALTER TABLE t DROP COLUMN a": "ALTER TABLE",
    "ALTER TABLE t RENAME TO u": "ALTER TABLE",
    "ALTER TABLE t RENAME COLUMN a TO b": "ALTER TABLE",
    "INSERT OR REPLACE INTO t (a) VALUES ('x')": "INSERT",
    "REPLACE INTO t (a) VALUES ('x')": "REPLACE",
    "INSERT INTO t (a) VALUES ('x') ON CONFLICT (a) DO UPDATE SET a = excluded.a": "INSERT",
    "CREATE TRIGGER tr AFTER INSERT ON t BEGIN DELETE FROM u": "CREATE TRIGGER",
    "CREATE VIEW v AS SELECT * FROM t": "CREATE VIEW",
    "CREATE VIRTUAL TABLE f USING fts5(a)": "CREATE VIRTUAL",
    "PRAGMA foreign_keys = OFF": "PRAGMA",
    "WITH x AS (SELECT 1) INSERT INTO t SELECT * FROM x": "WITH",
    VACUUM: "VACUUM",
  };
  for (const [statement, kind] of Object.entries(cases)) {
    const verdict = classifyStatement(statement);
    assert.equal(verdict.additive, false, statement);
    assert.equal(verdict.kind, kind, statement);
  }
});

test("a keyword inside quoted text does not make a statement destructive or additive", () => {
  assert.equal(
    classifyStatement("INSERT INTO t (a) VALUES ('DROP TABLE t; DELETE FROM u')").additive,
    true,
  );
  assert.equal(classifyStatement("UPDATE t SET a = 'CREATE TABLE x'").additive, false);
});

test("a migration with one destructive statement stops the whole deploy and names it", () => {
  const verdict = migrationVerdict([
    { file: "0017_ok.sql", sql: "CREATE TABLE a (x TEXT);\nINSERT INTO a VALUES ('y');" },
    { file: "0018_bad.sql", sql: "ALTER TABLE a ADD COLUMN z TEXT;\nDELETE FROM a WHERE x = 'y';" },
  ]);
  assert.equal(verdict.additive, false);
  assert.deepEqual(verdict.files, ["0017_ok.sql", "0018_bad.sql"]);
  assert.deepEqual(verdict.blocking, [
    { file: "0018_bad.sql", kind: "DELETE", statement: "DELETE FROM A WHERE X = ''" },
  ]);
});

test("every registry migration on main is additive, and the trust rows among them wait for the owner", () => {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .map((file) => ({ file, sql: readFileSync(`${MIGRATIONS}${file}`, "utf8") }));
  assert.ok(files.length > 10);
  const verdict = migrationVerdict(files);
  assert.deepEqual(verdict.blocking, []);
  assert.equal(verdict.additive, true);
  // Under the registry's trust tables, the seeded scopes and publishers are trust changes.
  const strict = migrationVerdict(files, { ownerTables: REGISTRY_TRUST_TABLES });
  assert.equal(strict.additive, false);
  const kinds = new Set(strict.blocking.map((b) => b.kind));
  assert.ok(kinds.has("INSERT INTO publishers"));
  assert.ok(kinds.has("INSERT INTO scopes"));
});

test("an insert into a table that grants rights stops for the owner; other inserts pass", () => {
  for (const table of REGISTRY_TRUST_TABLES) {
    const verdict = classifyStatement(
      `INSERT INTO ${table} (a) VALUES ('x')`,
      REGISTRY_TRUST_TABLES,
    );
    assert.equal(verdict.additive, false, table);
    assert.equal(verdict.trust, true, table);
  }
  assert.equal(
    classifyStatement('INSERT OR IGNORE INTO "main"."Publishers" VALUES (1)', REGISTRY_TRUST_TABLES)
      .additive,
    false,
  );
  assert.equal(
    classifyStatement("INSERT INTO versions (a) VALUES (1)", REGISTRY_TRUST_TABLES).additive,
    true,
  );
  assert.equal(
    classifyStatement("CREATE TABLE publishers_audit (a TEXT)", REGISTRY_TRUST_TABLES).additive,
    true,
  );
  assert.equal(insertTable("CREATE TABLE t (a)"), null);
  // Every trust table exists in the registry's schema.
  const schema = readdirSync(MIGRATIONS)
    .map((f) => readFileSync(`${MIGRATIONS}${f}`, "utf8"))
    .join("\n");
  for (const table of REGISTRY_TRUST_TABLES)
    assert.match(schema, new RegExp(`CREATE TABLE ${table} \\(`));
});

test("the CLI's arguments: the registry preset or named tables, then files", () => {
  assert.deepEqual(parseGateArgs(["--registry", "a.sql"]).ownerTables, [...REGISTRY_TRUST_TABLES]);
  assert.deepEqual(parseGateArgs(["--owner-tables", "Users, keys", "a.sql", "b.sql"]), {
    files: ["a.sql", "b.sql"],
    ownerTables: ["users", "keys"],
  });
  assert.equal(parseGateArgs([]), null);
  assert.equal(parseGateArgs(["--bogus", "a.sql"]), null);
});

test("wrangler's pending list is read fail-closed", () => {
  assert.deepEqual(pendingMigrations("✅ No migrations to apply!"), []);
  const table = [
    "Migrations to be applied:",
    "┌──────────────────────────┐",
    "│ Name                     │",
    "├──────────────────────────┤",
    "│ 0017_figentra_flow.sql   │",
    "├──────────────────────────┤",
    "│ 0018_licence_index.sql   │",
    "└──────────────────────────┘",
  ].join("\n");
  assert.deepEqual(pendingMigrations(table), ["0017_figentra_flow.sql", "0018_licence_index.sql"]);
  assert.throws(() => pendingMigrations("✘ [ERROR] Authentication error"), /neither/);
  assert.throws(() => pendingMigrations("Migrations to be applied:\n(none listed)"), /no file/);
});
