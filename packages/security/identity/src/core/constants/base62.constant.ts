/**
 * Stackra file contract:
 * Purpose: `BASE62`, the base-62 digits (`0-9A-Za-z`): the alphabet of an API key's body and checksum (URL-safe,
 *          double-click selectable).
 * Boundary: internal; `base62Of` writes numbers in it and `mintApiKey` draws the body from it.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 4 and 5).
 */

/** The base-62 digits. */
export const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
