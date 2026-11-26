/**
 * Stackra file contract:
 * Purpose: `TEST_TIER_VARIABLE`, the environment variable that tells a member's `stackra test` which tier to run when
 *          another tool starts it with no argument: `stackra test --tier wiring` sets it to `wiring` for `encore test`,
 *          whose test command is the member's `test` script.
 * Boundary: a constant string; `--tier` on the command line wins over it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 3: the thin Encore test suite for the wiring); STA-2838.
 */

/** The variable that carries the test tier to a `stackra test` that `encore test` starts. */
export const TEST_TIER_VARIABLE = "STACKRA_TEST_TIER";
