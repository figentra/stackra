/**
 * Stackra file contract:
 * Purpose: `CROCKFORD_ALPHABET`, the lowercase Crockford base32 alphabet of a public id's body (no i, l, o or u), the
 *          one `mintPublicId` in @stackra/contracts writes with.
 * Boundary: internal to the public-id codec (`publicIdToUuid`, `uuidToPublicId`); a change here breaks every stored id.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1).
 */

/** The 32 characters, by value. */
export const CROCKFORD_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
