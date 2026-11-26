/**
 * Stackra file contract:
 * Purpose: the mutation-testing trial of @stackra/iam (STA-2887): Stryker mutates the permission decision functions
 *          (`src/core/functions`: covers, selects, key matching, field access, policy decisions, break-glass) and
 *          reruns this package's vitest unit tier against each mutant, so the score says how many injected faults
 *          the tests catch, through `vitest.stryker.config.ts`. `pnpm test:mutation` runs it; it is not part of `test`
 *          or CI.
 * Boundary: test configuration only. Stryker works in `.stryker-tmp/` and writes `reports/mutation/`, both ignored by
 *           git. The `register-*` functions only fill registries at boot and are left out. No threshold breaks the
 *           run yet: the trial records the score (`AGENTS.md`), and a break line comes with the decision to gate on it.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers; the 90% security floor); STA-2887.
 */
/**
 * Stryker's options for @stackra/iam.
 *
 * @type {import("@stryker-mutator/api/core").PartialStrykerOptions}
 */
export default {
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.stryker.config.ts", related: false },
  mutate: ["src/core/functions/*.function.ts", "!src/core/functions/register-*.function.ts"],
  coverageAnalysis: "perTest",
  reporters: ["clear-text", "progress", "json", "html"],
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  thresholds: { high: 90, low: 80, break: null },
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
  incremental: false,
};
