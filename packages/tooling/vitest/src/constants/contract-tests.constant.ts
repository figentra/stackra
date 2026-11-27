/**
 * Stackra file contract:
 * Purpose: `CONTRACT_TESTS`, the globs of the contract tier: `<subject>.contract.test.ts(x)` in `__tests__/`, and the
 *          contract tests gen writes under `.stackra/tests/`.
 * Boundary: data only; `contractTier` reads it.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the contract tier and its `oasdiff` checks); ADR 0022 (test
 *                     placement); STA-2837.
 */
/** The contract tier, authored and generated. */
export const CONTRACT_TESTS = Object.freeze([
  "src/**/__tests__/**/*.contract.test.{ts,tsx}",
  ".stackra/tests/**/*.contract.test.ts",
]);
