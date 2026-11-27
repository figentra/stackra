/**
 * Stackra file contract:
 * Purpose: the `./contract` entry: `contractTier`, which a member's `vitest.contract.config.ts` wraps its own config
 *          in, and the `CONTRACT_TESTS` globs. `test:contract` runs `vitest run --config vitest.contract.config.ts`.
 * Boundary: re-exports only; it runs no tests itself.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the contract tier); STA-2837.
 */
export { CONTRACT_TESTS } from "./constants/contract-tests.constant.ts";
export { contractTier } from "./functions/contract-tier.function.ts";
