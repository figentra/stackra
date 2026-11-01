/**
 * Stackra file contract:
 * Purpose: `TEST_TIMEOUT_MS`, the per-test timeout of the unit preset.
 * Boundary: a number; every service test boots a PGlite (3 to 4 s of CPU alone), so vitest's 5 s default fires on a busy box.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */

/** How long one test may run before vitest fails it: 30 s, enough for a PGlite-backed service test on a loaded box. */
export const TEST_TIMEOUT_MS = 30_000;
