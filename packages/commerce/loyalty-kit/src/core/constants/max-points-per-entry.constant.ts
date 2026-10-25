/**
 * Stackra file contract:
 * Purpose: the hard ceiling on one ledger movement, shared by the redeem input, the ledger model
 *          and the resource form.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Field
 *           decorators read it as a literal-typed constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 26), ADR 0231
 */

/**
 * Largest absolute number of points one entry may move; a bigger movement is a schema refusal, not
 * a clamp.
 */
export const MAX_POINTS_PER_ENTRY = 1_000_000;
