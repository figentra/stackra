/**
 * Stackra file contract:
 * Purpose: gen-api test fixture: a pure pass-through of a platform type (folded into `...Base` rows).
 * Boundary: test data only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** Props of the fixture pass-through: every member comes from the platform's Date type. */
export type PassProps = Pick<Date, "getTime">;
