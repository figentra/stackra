/**
 * Stackra file contract:
 * Purpose: unit tests of `checkIsolationTier`: a unit-tier test that imports `assertRowSecurity` or
 *          `tenantIsolationOptions` from a published testing entry is a finding; the same file as `.int.test.ts`, the
 *          helpers' own `#` subpath imports, an import held in a string literal, a source file and `.old/` are not.
 * Boundary: test only; pure function, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0239 (decision 1).
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { checkIsolationTier } from "#node/functions/check-isolation-tier.function";

/** A test that asserts row-level security through the published helpers, the import split over lines. */
const ROW_SECURITY = [
  "import {",
  "  fakeTenantId,",
  "  tenantIsolationOptions,",
  '} from "@stackra/tenancy/testing";',
  "const { role } = tenantIsolationOptions();",
].join("\n");

test("checkIsolationTier: flags a unit-tier test that imports a row-security helper", () => {
  const [finding] = checkIsolationTier("services/x/src/__tests__/isolation.test.ts", ROW_SECURITY);
  assert.match(
    finding ?? "",
    /^services\/x\/src\/__tests__\/isolation\.test\.ts: .*\.int\.test\.ts/,
  );
  const audit = 'import { assertRowSecurity, usePostgres } from "@stackra/database/testing";';
  assert.equal(checkIsolationTier("services/x/src/__tests__/rls.test.ts", audit).length, 1);
});

test("checkIsolationTier: passes the integration tier, subpath imports, string literals and non-tests", () => {
  assert.deepEqual(
    checkIsolationTier("services/x/src/__tests__/isolation.int.test.ts", ROW_SECURITY),
    [],
  );
  const own =
    'import { tenantIsolationOptions } from "#testing/functions/tenant-isolation-options.function";';
  assert.deepEqual(checkIsolationTier("packages/t/src/__tests__/options.test.ts", own), []);
  const emitted = `  'import { assertRowSecurity } from "@stackra/database/testing";',`;
  assert.deepEqual(checkIsolationTier("packages/g/src/__tests__/emit.test.ts", emitted), []);
  assert.deepEqual(checkIsolationTier("services/x/src/rls.ts", ROW_SECURITY), []);
  assert.deepEqual(checkIsolationTier(".old/x/__tests__/isolation.test.ts", ROW_SECURITY), []);
  const fakesOnly = 'import { fakeTenantId, runAsTenant } from "@stackra/tenancy/testing";';
  assert.deepEqual(checkIsolationTier("services/x/src/__tests__/isolation.test.ts", fakesOnly), []);
});
