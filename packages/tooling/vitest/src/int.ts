/**
 * Stackra file contract:
 * Purpose: the `./int` entry: `intTier`, which a member's `vitest.int.config.ts` wraps its own config in, and the
 *          `INT_TESTS` globs. `test:int` runs `vitest run --config vitest.int.config.ts`.
 * Boundary: re-exports only; it runs no tests itself.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 1: test tiers); STA-1570.
 */
export { INT_TESTS } from "./constants/int-tests.constant.ts";
export { intTier } from "./functions/int-tier.function.ts";
