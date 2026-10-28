/**
 * Stackra file contract:
 * Purpose: unit tests of `checkRawSql` and `isRawSqlSource`: a raw SQL call (`.execute` or an imported `raw` with a
 *          literal) needs a `// raw-sql:` reason on its line, inside its statement or in the comment lines above the
 *          statement; query-builder modes, comment lines and a `raw` not imported from the ORM are not calls; the
 *          baseline count silences a file until it has more; tests and fixtures are not read.
 * Boundary: test only; pure functions, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0160 (decision 1); gap mo23 (stackra-288).
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { checkRawSql } from "#node/functions/check-raw-sql.function";
import { isRawSqlSource } from "#node/functions/is-raw-sql-source.function";

/** A double quote, kept out of the call-shaped strings below. */
const Q = '"';

/** The finding for `line` of `x.ts`. */
const finding = (line: number): string =>
  `x.ts:${line}: raw SQL without a reason; put a \`// raw-sql: <why>\` comment above the statement (ADR 0160)`;

test("checkRawSql: flags an execute with a literal and an imported raw without a reason", () => {
  const src = [
    `import { raw } from ${Q}@mikro-orm/core${Q};`,
    `await em.execute(${Q}select 1${Q});`,
    "const total = raw(`count(*)`);",
  ].join("\n");
  assert.deepEqual(checkRawSql("x.ts", src), [finding(2), finding(3)]);
});

test("checkRawSql: accepts a reason on the line, inside the statement or in the comments above it", () => {
  const src = [
    "async function run(): Promise<void> {",
    "  // raw-sql: the advisory lock is session state the ORM has no verb for",
    `  await em.execute(${Q}select pg_advisory_lock(1)${Q});`,
    "  const [row] = (await em",
    "    // raw-sql: one statement claims and returns the row",
    `    .execute(${Q}update jobs set claimed = true returning id${Q})) as Row[];`,
    `  await em.execute(${Q}select 2${Q}); // raw-sql: a health probe`,
    "  // raw-sql: the reason covers the whole statement",
    "  const rows = await em",
    "    .getConnection()",
    `    .execute(${Q}select 3${Q});`,
    "}",
  ].join("\n");
  assert.deepEqual(checkRawSql("x.ts", src), []);
});

test("checkRawSql: a reason above a finished statement does not cover the next one", () => {
  const src = [
    "{",
    "  // raw-sql: only the first",
    `  await em.execute(${Q}select 1${Q});`,
    `  await em.execute(${Q}select 2${Q});`,
    "}",
  ].join("\n");
  assert.deepEqual(checkRawSql("x.ts", src), [finding(4)]);
});

test("checkRawSql: skips query-builder modes, comment lines, non-literal SQL and a raw of another module", () => {
  const src = [
    `const row = await qb.execute(${Q}get${Q});`,
    "const rows = await qb.execute('all');",
    " * em.execute(`select 1`) in a comment",
    "await em.execute(statement);",
    `const line = raw(${Q}PRODID${Q}, feed.prodId);`,
  ].join("\n");
  assert.deepEqual(checkRawSql("x.ts", src), []);
});

test("checkRawSql: the baseline count silences a file until it has more calls without a reason", () => {
  const src = [`await em.execute(${Q}select 1${Q});`, `await em.execute(${Q}select 2${Q});`].join(
    "\n",
  );
  assert.deepEqual(checkRawSql("x.ts", src, 2), []);
  assert.deepEqual(checkRawSql("x.ts", src, 1), [finding(1), finding(2)]);
});

test("isRawSqlSource: member source only, never tests or fixtures", () => {
  assert.equal(
    isRawSqlSource("packages/runtime/queue/src/node/drivers/postgres-queue.driver.ts"),
    true,
  );
  for (const p of [
    "packages/runtime/queue/src/node/drivers/__tests__/postgres-queue.driver.test.ts",
    "packages/data/database/src/testing/__tests__/use-postgres.int.test.ts",
    "packages/data/model/src/core/__fixtures__/a.ts",
    "packages/tooling/oxlint/src/__tests__/fixtures/packages/demo/pkg/src/index.ts",
    "README.md",
  ])
    assert.equal(isRawSqlSource(p), false);
});
