/**
 * Stackra file contract:
 * Purpose: `DevIssuerKey`, one dev issuer key pair as JWKs with the same `kid`: the private half `mintDevToken` signs
 *          with (kept in the workspace's `.stackra/dev-issuer.json`) and the public half `stackra dev` hands the
 *          running services in `STACKRA_DEV_ISSUER_KEYS`.
 * Boundary: a type only. ECDSA P-256 (`ES256`), made by `createDevIssuerKey`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer).
 */

/** A dev issuer key pair. */
export interface DevIssuerKey {
  /** The signing half, with its `kid`; never leaves the developer's workspace. */
  readonly privateKey: JsonWebKey & { readonly kid: string };

  /** The verifying half, with the same `kid`. */
  readonly publicKey: JsonWebKey & { readonly kid: string };
}
