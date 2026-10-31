/**
 * Stackra file contract:
 * Purpose: hold `session-settings.mjs` to its contract: any `set_config` of an `app.*` or non-literal name outside the
 *          allow list, a `testing` helper and a test is a finding whatever its third argument; the session form (`set_config`
 *          with a `false` or a parameter, `SET`, `SET LOCAL` and `SET SESSION app.` also quoted, `-c app.`) is a finding
 *          everywhere, allow-listed files, helpers and tests included, and in `.sql`, `.js`, `.cjs`, `.mts` and `.cts`
 *          files too. The older cases: `set_config` with a `false`, a parameter or a missing third
 *          argument and the statements `SET app.` and `SET LOCAL app.` (any case, any line break) are findings with
 *          their file and line; `set_config(..., true)` is not, nor are a test file, an allow-listed path or a file
 *          outside `packages/`, `services/`, `apps/` and `workers/`; commas inside strings and calls do not shift the
 *          third argument; the shipped allow list names only the isolation driver, `TenantIsolationService` and the
 *          database drivers.
 * Boundary: writes fixture trees into temp directories; the last test reads this checkout, which must be clean.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0495 (decision 3); STA-1699.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { ALLOWED, sessionSettingFindings, settingProblems } from "../session-settings.mjs";

/** A temp repository whose files are `files` (repository path to text). */
function repository(files) {
  const root = mkdtempSync(join(tmpdir(), "session-settings-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

test("a set_config whose third argument is not the literal true is a finding", () => {
  assert.equal(
    settingProblems("select set_config('app.tenant_id', ?, false)", { outsideAllowed: false })
      .length,
    1,
  );
  assert.equal(
    settingProblems("select set_config('app.tenant_id', ?, FALSE)", { outsideAllowed: false })
      .length,
    1,
  );
  assert.equal(
    settingProblems("select set_config('app.tenant_id', ?, ?)", { outsideAllowed: false }).length,
    1,
  );
  assert.equal(
    settingProblems("select set_config('app.tenant_id', ?)", { outsideAllowed: false }).length,
    0,
  );
  assert.equal(settingProblems("select set_config('app.tenant_id', ?, true)").length, 1);
  assert.equal(
    settingProblems("select set_config('app.tenant_id', ?, true)", { outsideAllowed: false })
      .length,
    0,
  );
  assert.equal(settingProblems("select set_config ( 'app.x' , ? , TRUE )").length, 1);
  assert.equal(settingProblems("select set_config('search_path', '', true)").length, 0);
  assert.equal(settingProblems("select set_config(?, ?, true)").length, 1);
});

test("the third argument is found across lines, commas in strings and nested calls", () => {
  const text = [
    "await em.execute(",
    "  `select set_config('a,b', coalesce(?, ''), false)`,",
    ");",
  ].join("\n");
  assert.deepEqual(
    settingProblems(text).map(({ line }) => line),
    [2],
  );
  assert.equal(
    settingProblems("set_config('app.x', f(1, 2), true)", { outsideAllowed: false }).length,
    0,
  );
});

test("SET app. and SET LOCAL app. are findings in any case, across a line break too", () => {
  assert.equal(settingProblems("await em.execute('SET app.tenant_id = 1')").length, 1);
  assert.equal(settingProblems("await em.execute('set local app.tenant_id = 1')").length, 1);
  assert.equal(settingProblems("SET\n  LOCAL app.x = 1").length, 1);
  assert.equal(settingProblems("set  app.scope_id to 'x'").length, 1);
  assert.equal(settingProblems("SET SESSION app.x = 1").length, 1);
  assert.equal(settingProblems('SET "app".x = 1').length, 1);
  assert.equal(settingProblems('SET LOCAL "app".x = 1').length, 1);
  assert.equal(settingProblems("await em.execute('set local role app_user')").length, 0);
  assert.equal(settingProblems("// it sets app.tenant_id for the call").length, 0);
});

test("a startup option -c app. is a finding", () => {
  assert.equal(settingProblems("options: '-c app.tenant_id=x'").length, 1);
  assert.equal(settingProblems("options: '-capp.tenant_id=x'").length, 1);
  assert.equal(settingProblems("options: '-c statement_timeout=1'").length, 0);
});

test("a finding names its file and line", () => {
  const root = repository({
    "services/orders/src/a.ts": "const ok = 1;\nconst sql = 'SET LOCAL app.tenant_id = 1';\n",
  });
  assert.deepEqual(sessionSettingFindings(root, {}), [
    {
      dir: "services/orders/src/a.ts:2",
      text: "`SET LOCAL app.` sets an app.* setting by statement; use select set_config(name, value, true) in the isolation driver",
    },
  ]);
});

test("packages, services, apps and workers are scanned in ts, tsx, js, cjs, mjs, mts, cts and sql", () => {
  const bad = "select set_config('app.x', 'y', false)";
  const root = repository({
    "packages/data/x/src/a.ts": bad,
    "services/orders/src/b.tsx": bad,
    "apps/console/src/c.mjs": bad,
    "workers/static/src/d.ts": bad,
    "packages/data/x/src/e.js": bad,
    "packages/data/x/src/f.cjs": bad,
    "packages/data/x/src/g.mts": bad,
    "packages/data/x/src/h.cts": bad,
    "packages/data/x/migrations/0001.sql": "SET SESSION app.x = 1;",
    "tools/scripts/e.mjs": bad,
    "packages/data/x/src/f.md": bad,
    "packages/data/x/node_modules/dep/index.ts": bad,
    "packages/data/x/dist/index.mjs": bad,
  });
  const found = sessionSettingFindings(root, {}).map(({ dir }) => dir);
  assert.deepEqual([...new Set(found)].sort(), [
    "apps/console/src/c.mjs:1",
    "packages/data/x/migrations/0001.sql:1",
    "packages/data/x/src/a.ts:1",
    "packages/data/x/src/e.js:1",
    "packages/data/x/src/f.cjs:1",
    "packages/data/x/src/g.mts:1",
    "packages/data/x/src/h.cts:1",
    "services/orders/src/b.tsx:1",
    "workers/static/src/d.ts:1",
  ]);
});

test("an app.* set_config is exempt in the allow list, a testing helper and a test; the session form never is", () => {
  const good = "select set_config('app.x', 'y', true)";
  const bad = "select set_config('app.x', 'y', false)";
  const root = repository({
    "packages/data/x/src/__tests__/a.test.ts": good,
    "packages/data/x/src/b.test.ts": good,
    "packages/data/x/src/testing/helper.ts": good,
    "packages/data/x/src/driver.ts": good,
    "packages/data/x/src/other.ts": good,
    "packages/data/x/src/__tests__/session.test.ts": bad,
    "packages/data/x/src/testing/session.ts": bad,
    "packages/data/x/src/session-driver.ts": bad,
  });
  const allowed = {
    "packages/data/x/src/driver.ts": "the driver",
    "packages/data/x/src/session-driver.ts": "the session driver",
  };
  assert.deepEqual(
    sessionSettingFindings(root, allowed)
      .map(({ dir }) => dir)
      .sort(),
    [
      "packages/data/x/src/__tests__/session.test.ts:1",
      "packages/data/x/src/other.ts:1",
      "packages/data/x/src/session-driver.ts:1",
      "packages/data/x/src/testing/session.ts:1",
    ],
  );
});

test("the shipped allow list is the isolation driver, TenantIsolationService, the database drivers and the iam snapshot store", () => {
  assert.deepEqual(Object.keys(ALLOWED).sort(), [
    "packages/data/database/src/node/drivers/postgres-database.driver.ts",
    "packages/data/database/src/testing/drivers/memory-database.driver.ts",
    "packages/security/iam/src/node/drivers/postgres-policy-snapshot-store.driver.ts",
    "packages/security/tenancy/src/node/drivers/call-isolation.driver.ts",
    "packages/security/tenancy/src/node/services/tenant-isolation.service.ts",
  ]);
  for (const reason of Object.values(ALLOWED)) assert.ok(reason.length > 20);
});

test("this checkout has no finding", () => {
  const root = new URL("../../../", import.meta.url).pathname;
  assert.deepEqual(sessionSettingFindings(root), []);
});
