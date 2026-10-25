/**
 * Stackra file contract:
 * Purpose: the reference prefix of the entry that gives a hold's points back when its order ends
 *          unpaid.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Used by
 *           LoyaltyService, so every driver sees the same convention.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2), ADR 0231
 */

/**
 * The reference of the entry that gives held points back: this prefix plus the caller's
 * reference, so a reference is released at most once whatever the number of calls.
 */
export const RELEASE_REFERENCE_PREFIX = "release:";
