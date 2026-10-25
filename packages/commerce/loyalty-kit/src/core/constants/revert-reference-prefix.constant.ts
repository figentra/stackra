/**
 * Stackra file contract:
 * Purpose: the reference prefix of the entry that credits back a redemption whose host never confirmed it.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Used by the redeem
 *           workflow's undo, so a repeated undo credits nothing twice and every driver sees the same convention.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2), ADR 0231
 */

/**
 * A revert entry's reference is this prefix plus the redemption's reference (an order id), so the undo of one
 * redemption writes at most one `adjust` entry.
 */
export const REVERT_REFERENCE_PREFIX = "revert:";
