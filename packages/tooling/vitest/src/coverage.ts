/**
 * Stackra file contract:
 * Purpose: the ONE coverage gate for the workspace packages and services. Every member's vitest config wraps its
 *          config in `withCoverage()`, which picks the member's floor: 80/80/70 for every member, 90/90/80 for the
 *          packages ADR 0182 names (`STRICT_COVERAGE_PACKAGES`). `pnpm test:coverage` (packages and services) runs
 *          `vitest run --coverage` against it; the testbed's `verify` preset (`pnpm verify:box`) and
 *          `stackra check --with-tests` run it. Apps are NOT gated here. Provider: @vitest/coverage-v8.
 * Boundary: the `./coverage` entry: re-exports the shared coverage block, the floors and the wrapper; it runs no
 *           tests itself.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: coverage floors); ADR 0007 (documentation); ADR 0022 (test placement).
 * Owner: release-operations · Secrets: forbidden
 * Change policy: a threshold moves only upward, in a changeset; a package that cannot meet it names why in
 *                its own vitest.config.ts (`withCoverage(config, { thresholds: {...} })`).
 */
export { COVERAGE_THRESHOLDS } from "./constants/coverage-thresholds.constant.ts";
export { STRICT_COVERAGE_PACKAGES } from "./constants/strict-coverage-packages.constant.ts";
export { STRICT_COVERAGE_THRESHOLDS } from "./constants/strict-coverage-thresholds.constant.ts";
export { coverage } from "./constants/coverage.constant.ts";
export { coverageThresholdsFor } from "./functions/coverage-thresholds-for.function.ts";
export { withCoverage } from "./functions/with-coverage.function.ts";
export type { CoverageOverrides } from "./types/coverage-overrides.type.ts";
