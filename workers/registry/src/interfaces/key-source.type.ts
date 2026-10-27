/**
 * Stackra file contract:
 * Purpose: `KeySource`: finds the public key of a `kid`.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */

/** Finds the public key of a `kid`. */
export type KeySource = (kid: string) => Promise<JsonWebKey | null>;
