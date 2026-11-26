/**
 * Stackra file contract:
 * Purpose: `OPT_IN_PHASES`, the `stackra check` phases that run only on request (`--with-tests`, or named in
 *          `--only`): `test` and `coverage`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0182 (test tiers and coverage).
 */
/** The phases `--with-tests` adds. */
export const OPT_IN_PHASES: readonly string[] = ["test", "coverage"];
