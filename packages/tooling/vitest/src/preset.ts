/**
 * Stackra file contract:
 * Purpose: the base vitest preset every workspace extends. Globals on (describe/it/expect without imports),
 *          `passWithNoTests` OFF so an empty suite is a finding, not a pass, and the v8 coverage provider.
 *          The coverage thresholds themselves live in the repo root `vitest.shared.ts` (`withCoverage`), so one
 *          place owns the gate. Resolution prefers the `@stackra/source` export condition (ADR 0025), so a test reads a
 *          workspace package's source, not its built dist; the rest of each list is Vite's default.
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig } from "vitest/config";

/**
 * Base vitest preset used by all workspace members.
 * Enables globals (describe, it, expect) to avoid imports; fails a suite with no tests; reports v8 coverage.
 * Coverage thresholds are added by `withCoverage()` from the coverage module.
 */
export const stackraVitest = defineConfig({
  resolve: { conditions: ["@stackra/source", "module", "browser", "development|production"] },
  ssr: { resolve: { conditions: ["@stackra/source", "module", "node", "development|production"] } },
  test: {
    globals: true,
    passWithNoTests: false,
    environment: "node",
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
});
