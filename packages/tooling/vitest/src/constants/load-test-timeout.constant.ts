/**
 * Stackra file contract:
 * Purpose: `LOAD_TEST_TIMEOUT_MS`, the per-test timeout of the load tier.
 * Boundary: a number; a soak runs for as long as its k6 duration says (`STACKRA_LOAD_DURATION`, an hour at most in the
 *           weekly run), then drains what it queued, so the unit tier's 30 s would stop every one of them.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/** How long one load test may run before vitest fails it: two hours, an hour's soak and its drain with room to spare. */
export const LOAD_TEST_TIMEOUT_MS = 7_200_000;
