/**
 * Stackra file contract:
 * Purpose: test config of @stackra/starter: plain vitest for the build script's tests (`scripts/__tests__/*.test.mjs`);
 *          `passWithNoTests` off so an empty suite fails. The package ships data, not framework code, so it does not
 *          consume the framework vitest preset.
 * Boundary: test configuration only. Authored and tracked (`git add -f` past the .gitignore rule for gen's shim):
 *           the member has no gen task, so without this file a checkout would run the suite on vitest's defaults
 *           (an emptied suite passing, a 5 s timeout for tests that fetch a git fixture).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); ADR 0022 (test placement); ADR 0295 decision 5 (authored root configs).
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/**/__tests__/**/*.test.mjs"],
    passWithNoTests: false,
    testTimeout: 60_000,
  },
});
