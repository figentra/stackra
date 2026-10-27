/**
 * Stackra file contract:
 * Purpose: `OidcError`: A token the registry refuses.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */

/** A token the registry refuses. */
export class OidcError extends Error {
  /** The error name, so logs and checks can tell an OIDC refusal apart. */
  override readonly name = "OidcError";
}
