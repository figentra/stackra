/**
 * Stackra file contract:
 * Purpose: the base vitest preset every workspace extends. Globals on (describe/it/expect without imports),
 *          `passWithNoTests` OFF so an empty suite is a finding, not a pass, and the v8 coverage provider.
 *          The coverage thresholds themselves live in the repo root `vitest.shared.ts` (`withCoverage`), so one
 *          place owns the gate.
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig } from "vitest/config";

/**
 * Base vitest preset used by all workspace members.
 * Enables globals (describe, it, expect) to avoid imports; fails a suite with no tests; reports v8 coverage.
 * Coverage thresholds are added by `withCoverage()` from the coverage module.
 */
export const stackraVitest = defineConfig({
  test: {
    globals: true,
    passWithNoTests: false,
    environment: "node",
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
});
