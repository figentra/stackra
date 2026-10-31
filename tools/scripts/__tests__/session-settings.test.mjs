/**
 * Stackra file contract:
 * Purpose: hold `session-settings.mjs` to its contract: `set_config` with a `false`, a parameter or a missing third
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
  assert.equal(settingProblems("select set_config('app.tenant_id', ?, false)").length, 1);
  assert.equal(settingProblems("select set_config('app.tenant_id', ?, FALSE)").length, 1);
  assert.equal(settingProblems("select set_config('app.tenant_id', ?, ?)").length, 1);
  assert.equal(settingProblems("select set_config('app.tenant_id', ?)").length, 0);
  assert.equal(settingProblems("select set_config('app.tenant_id', ?, true)").length, 0);
  assert.equal(settingProblems("select set_config ( 'app.x' , ? , TRUE )").length, 0);
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
  assert.equal(settingProblems("set_config('app.x', f(1, 2), true)").length, 0);
});

test("SET app. and SET LOCAL app. are findings in any case, across a line break too", () => {
  assert.equal(settingProblems("await em.execute('SET app.tenant_id = 1')").length, 1);
  assert.equal(settingProblems("await em.execute('set local app.tenant_id = 1')").length, 1);
  assert.equal(settingProblems("SET\n  LOCAL app.x = 1").length, 1);
  assert.equal(settingProblems("set  app.scope_id to 'x'").length, 1);
  assert.equal(settingProblems("await em.execute('set local role app_user')").length, 0);
  assert.equal(settingProblems("// it sets app.tenant_id for the call").length, 0);
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

test("packages, services, apps and workers are scanned in ts, tsx and mjs", () => {
  const bad = "select set_config('app.x', 'y', false)";
  const root = repository({
    "packages/data/x/src/a.ts": bad,
    "services/orders/src/b.tsx": bad,
    "apps/console/src/c.mjs": bad,
    "workers/static/src/d.ts": bad,
    "tools/scripts/e.mjs": bad,
    "packages/data/x/src/f.md": bad,
    "packages/data/x/node_modules/dep/index.ts": bad,
    "packages/data/x/dist/index.mjs": bad,
  });
  assert.deepEqual(
    sessionSettingFindings(root, {}).map(({ dir }) => dir),
    [
      "packages/data/x/src/a.ts:1",
      "services/orders/src/b.tsx:1",
      "apps/console/src/c.mjs:1",
      "workers/static/src/d.ts:1",
    ],
  );
});

test("a test file and an allow-listed path are exempt", () => {
  const bad = "select set_config('app.x', 'y', false)";
  const root = repository({
    "packages/data/x/src/__tests__/a.test.ts": bad,
    "packages/data/x/src/__tests__/helper.ts": bad,
    "packages/data/x/src/b.test.ts": bad,
    "packages/data/x/src/driver.ts": bad,
    "packages/data/x/src/other.ts": bad,
  });
  assert.deepEqual(
    sessionSettingFindings(root, { "packages/data/x/src/driver.ts": "the driver" }).map(
      ({ dir }) => dir,
    ),
    ["packages/data/x/src/other.ts:1"],
  );
});

test("the shipped allow list is the isolation driver, TenantIsolationService and the database drivers", () => {
  assert.deepEqual(Object.keys(ALLOWED).sort(), [
    "packages/data/database/src/node/drivers/postgres-database.driver.ts",
    "packages/data/database/src/testing/drivers/memory-database.driver.ts",
    "packages/security/tenancy/src/node/drivers/call-isolation.driver.ts",
    "packages/security/tenancy/src/node/services/tenant-isolation.service.ts",
  ]);
  for (const reason of Object.values(ALLOWED)) assert.ok(reason.length > 20);
});

test("this checkout has no finding", () => {
  const root = new URL("../../../", import.meta.url).pathname;
  assert.deepEqual(sessionSettingFindings(root), []);
});
