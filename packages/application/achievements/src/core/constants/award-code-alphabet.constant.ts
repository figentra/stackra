/**
 * Stackra file contract:
 * Purpose: `AWARD_CODE_ALPHABET`, the 32 characters of an award's short verify code: Crockford base32 (digits and
 *          capitals without I, L, O and U), so a code read off paper is typed without confusing look-alikes.
 * Boundary: a frozen string, the format of the code, not business data.
 * Runtime: isomorphic
 * Governing contract: ADR 0432 (decision 2).
 */

/** Crockford base32. */
export const AWARD_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
