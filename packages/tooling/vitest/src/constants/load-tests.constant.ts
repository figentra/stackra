/**
 * Stackra file contract:
 * Purpose: `LOAD_TESTS`, the glob of the load tier: `<subject>.load.test.ts(x)` in `__tests__/`, each of which serves its
 *          subject and drives it with k6.
 * Boundary: data only; `loadTier` reads it.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the load tier, weekly k6 load tests); ADR 0022 (test placement);
 *                     STA-317.
 */

/** The load tier: authored only, gen writes no load test. */
export const LOAD_TESTS = Object.freeze(["src/**/__tests__/**/*.load.test.{ts,tsx}"]);
