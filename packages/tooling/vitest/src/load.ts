/**
 * Stackra file contract:
 * Purpose: the `./load` entry: `loadTier`, which the `.stackra/vitest.load.config.ts` gen writes wraps the member's
 *          config in, the `LOAD_TESTS` glob and `LOAD_TEST_TIMEOUT_MS`. `test:load` runs `stackra test --tier load`.
 * Boundary: re-exports only; it runs no tests itself.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4); STA-317.
 */
export { LOAD_TEST_TIMEOUT_MS } from "./constants/load-test-timeout.constant.ts";
export { LOAD_TESTS } from "./constants/load-tests.constant.ts";
export { loadTier } from "./functions/load-tier.function.ts";
