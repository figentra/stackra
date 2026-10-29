/**
 * Stackra file contract:
 * Purpose: `INT_TESTS`, the globs of the integration tier: `<subject>.int.test.ts(x)` in `__tests__/`, and the tests
 *          gen writes under `.stackra/tests/` (the tenant-isolation test of a service with owned models).
 * Boundary: data only; `intTier` and `servicePreset` read it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 1: test tiers); ADR 0022 (test placement); STA-1570.
 */
/** The integration tier, authored and generated. */
export const INT_TESTS = Object.freeze([
  "src/**/__tests__/**/*.int.test.{ts,tsx}",
  ".stackra/tests/**/*.int.test.ts",
]);
