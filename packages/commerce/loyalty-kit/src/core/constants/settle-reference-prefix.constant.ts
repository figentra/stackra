/**
 * Stackra file contract:
 * Purpose: the reference prefix of the entry that offsets a hold when it is settled into a
 *          redemption.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Used by
 *           LoyaltyService, so every driver sees the same convention.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2), ADR 0231
 */

/**
 * The reference of the entry that offsets a settled hold: this prefix plus the caller's
 * reference, so settling twice writes nothing new.
 */
export const SETTLE_REFERENCE_PREFIX = "settle:";
