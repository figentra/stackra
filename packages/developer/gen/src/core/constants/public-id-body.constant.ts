/**
 * Stackra file contract:
 * Purpose: `PUBLIC_ID_BODY`, the JSON Schema pattern of a public id's body after its prefix and `_`: 26 Crockford
 *          base32 characters, either case, without I, L, O and U. `jsonSchemaOf` writes it, `zodOfJsonSchema` reads it
 *          back and `compareManifests` accepts it in place of the looser body of an earlier manifest (STA-2060).
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids are Crockford base32).
 */

/** The Crockford base32 body of a public id. */
export const PUBLIC_ID_BODY = "[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}";
