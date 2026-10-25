/**
 * Stackra file contract:
 * Purpose: the reference prefix of an expiry entry, shared by the memory driver and the journal
 *          reversal of the postgres driver so both name the same convention.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2), ADR 0231
 */

/**
 * An expiry entry's reference is this prefix plus the earn entry's reference, so expiring twice
 * writes nothing new.
 */
export const EXPIRE_REFERENCE_PREFIX = "expire:";
