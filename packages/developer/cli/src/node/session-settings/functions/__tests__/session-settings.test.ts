/**
 * Stackra file contract:
 * Purpose: hold the session-setting check of `stackra validate --repository` (was `session-settings.mjs`) to its
 *          contract: any set_config of an `app.*` or non-literal name outside the allow list, a `testing` helper and a
 *          test is a finding whatever its third argument; the session form (set_config with a `false` or a parameter,
 *          the SET, SET LOCAL and SET SESSION statements of an `app` setting, also quoted, and a `-c` startup option of
 *          one) is a finding everywhere, allow-listed files, helpers and tests included, and in `.sql`, `.js`, `.cjs`,
 *          `.mts` and `.cts` files too. The older cases: set_config with a `false`, a parameter or a missing third
 *          argument and the SET and SET LOCAL statements (any case, any line break) are findings with their file and
 *          line; set_config with the literal `true` is not, nor are a test file, an allow-listed path or a file
 *          outside `packages/`, `services/`, `apps/` and `workers/`; commas inside strings and calls do not shift the
 *          third argument; the shipped allow list names only the isolation driver, `TenantIsolationService`, the
 *          database drivers and the iam snapshot store.
 * Boundary: writes fixture trees into temp directories; the last test reads this checkout, which must be clean. The
 *           check scans this file too (rule 1 exempts no test), so the fixtures splice `SC` and `A` into the forms.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0495 (decision 3); STA-1699.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import { SESSION_SETTING_ALLOWED } from "#node/session-settings/constants/session-setting-allowed.constant";
import { sessionSettingFindings } from "#node/session-settings/functions/session-setting-findings.function";
import { settingProblems } from "#node/session-settings/functions/setting-problems.function";

/** The function name and the namespace, spliced into the fixtures so this file passes the check it tests. */
const SC = "set_config";
const A = "app";

/** A temp repository whose files are `files` (repository path to text). */
function repository(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "session-settings-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

test("a set_config whose third argument is not the literal true is a finding", () => {
  const inside = { outsideAllowed: false };
  assert.equal(settingProblems(`select ${SC}('${A}.tenant_id', ?, false)`, inside).length, 1);
  assert.equal(settingProblems(`select ${SC}('${A}.tenant_id', ?, FALSE)`, inside).length, 1);
  assert.equal(settingProblems(`select ${SC}('${A}.tenant_id', ?, ?)`, inside).length, 1);
  assert.equal(settingProblems(`select ${SC}('${A}.tenant_id', ?)`, inside).length, 0);
  assert.equal(settingProblems(`select ${SC}('${A}.tenant_id', ?, true)`).length, 1);
  assert.equal(settingProblems(`select ${SC}('${A}.tenant_id', ?, true)`, inside).length, 0);
  assert.equal(settingProblems(`select ${SC} ( '${A}.x' , ? , TRUE )`).length, 1);
  assert.equal(settingProblems(`select ${SC}('search_path', '', true)`).length, 0);
  assert.equal(settingProblems(`select ${SC}(?, ?, true)`).length, 1);
});

test("the third argument is found across lines, commas in strings and nested calls", () => {
  const text = [
    "await em.execute(",
    `  \`select ${SC}('a,b', coalesce(?, ''), false)\`,`,
    ");",
  ].join("\n");
  assert.deepEqual(
    settingProblems(text).map(({ line }) => line),
    [2],
  );
  assert.equal(
    settingProblems(`${SC}('${A}.x', f(1, 2), true)`, { outsideAllowed: false }).length,
    0,
  );
});

test("the SET and SET LOCAL statements of an app setting are findings in any case, across a line break too", () => {
  assert.equal(settingProblems(`await em.execute('SET ${A}.tenant_id = 1')`).length, 1);
  assert.equal(settingProblems(`await em.execute('set local ${A}.tenant_id = 1')`).length, 1);
  assert.equal(settingProblems(`SET\n  LOCAL ${A}.x = 1`).length, 1);
  assert.equal(settingProblems(`set  ${A}.scope_id to 'x'`).length, 1);
  assert.equal(settingProblems(`SET SESSION ${A}.x = 1`).length, 1);
  assert.equal(settingProblems(`SET "${A}".x = 1`).length, 1);
  assert.equal(settingProblems(`SET LOCAL "${A}".x = 1`).length, 1);
  assert.equal(settingProblems("await em.execute('set local role app_user')").length, 0);
  assert.equal(settingProblems("// it sets app.tenant_id for the call").length, 0);
});

test("a -c startup option of an app setting is a finding", () => {
  assert.equal(settingProblems(`options: '-c ${A}.tenant_id=x'`).length, 1);
  assert.equal(settingProblems(`options: '-c${A}.tenant_id=x'`).length, 1);
  assert.equal(settingProblems("options: '-c statement_timeout=1'").length, 0);
});

test("a finding names its file and line", () => {
  const root = repository({
    "services/orders/src/a.ts": `const ok = 1;\nconst sql = 'SET LOCAL ${A}.tenant_id = 1';\n`,
  });
  assert.deepEqual(sessionSettingFindings(root, {}), [
    {
      dir: "services/orders/src/a.ts:2",
      text: `\`SET LOCAL ${A}.\` sets an ${A}.* setting by statement; use select ${SC}(name, value, true) in the isolation driver`,
    },
  ]);
});

test("packages, services, apps and workers are scanned in ts, tsx, js, cjs, mjs, mts, cts and sql", () => {
  const bad = `select ${SC}('${A}.x', 'y', false)`;
  const root = repository({
    "packages/data/x/src/a.ts": bad,
    "services/orders/src/b.tsx": bad,
    "apps/console/src/c.mjs": bad,
    "workers/static/src/d.ts": bad,
    "packages/data/x/src/e.js": bad,
    "packages/data/x/src/f.cjs": bad,
    "packages/data/x/src/g.mts": bad,
    "packages/data/x/src/h.cts": bad,
    "packages/data/x/migrations/0001.sql": `SET SESSION ${A}.x = 1;`,
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
  const good = `select ${SC}('${A}.x', 'y', true)`;
  const bad = `select ${SC}('${A}.x', 'y', false)`;
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

test("the shipped allow list is the isolation driver, TenantIsolationService, withScope, the settings replay, the iam snapshot store and runAsTenant's test seam", () => {
  assert.deepEqual(Object.keys(SESSION_SETTING_ALLOWED).sort(), [
    "packages/data/database/src/core/functions/replay-row-security-settings.function.ts",
    "packages/data/database/src/core/functions/run-in-scope.function.ts",
    "packages/security/iam/src/node/drivers/postgres-policy-snapshot-store.driver.ts",
    "packages/security/tenancy/src/node/drivers/call-isolation.driver.ts",
    "packages/security/tenancy/src/node/services/tenant-isolation.service.ts",
    "packages/security/tenancy/src/testing/orm/run-as-tenant.subscriber.ts",
  ]);
  for (const reason of Object.values(SESSION_SETTING_ALLOWED)) assert.ok(reason.length > 20);
});

test("this checkout has no finding", () => {
  const root = fileURLToPath(new URL("../../../../../../../../", import.meta.url));
  assert.deepEqual(sessionSettingFindings(root), []);
});
