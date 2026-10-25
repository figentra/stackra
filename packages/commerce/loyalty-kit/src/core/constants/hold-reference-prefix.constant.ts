/**
 * Stackra file contract:
 * Purpose: the reference prefix of a hold entry, which reserves points for a reference (an order)
 *          until it is settled or released.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Used by
 *           LoyaltyService, so every driver sees the same convention.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2), ADR 0231
 */

/**
 * A hold entry's reference is this prefix plus the caller's reference (an order id), so a
 * repeated hold for one order writes nothing new.
 */
export const HOLD_REFERENCE_PREFIX = "hold:";
