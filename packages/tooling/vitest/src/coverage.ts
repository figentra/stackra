/**
 * Stackra file contract:
 * Purpose: the ONE coverage gate for the workspace packages. Every `packages/**` vitest.config.ts wraps its
 *          config in `withCoverage()`; `pnpm test:coverage` and the CI job run `vitest run --coverage` against
 *          these thresholds. Apps are NOT gated here. Provider: @vitest/coverage-v8.
 * Boundary: the `./coverage` entry: re-exports the shared coverage block and its wrapper; it runs no tests itself.
 * Runtime: node
 * Governing contract: ADR 0007 (documentation); ADR 0022 (test placement).
 * Owner: release-operations · Secrets: forbidden
 * Change policy: a threshold moves only upward, in a changeset; a package that cannot meet it names why in
 *                its own vitest.config.ts (`withCoverage(config, { thresholds: {...} })`).
 */
export { COVERAGE_THRESHOLDS } from "./constants/coverage-thresholds.constant.ts";
export { coverage } from "./constants/coverage.constant.ts";
export { withCoverage } from "./functions/with-coverage.function.ts";
export type { CoverageOverrides } from "./types/coverage-overrides.type.ts";
