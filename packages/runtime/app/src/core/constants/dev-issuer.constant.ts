/**
 * Stackra file contract:
 * Purpose: `DEV_ISSUER`, the fixed facts of the dev sign-in (STA-2795): the issuer and audience every dev token
 *          carries, the variable `stackra dev` puts the dev issuer's public key set in, and the one environment that
 *          accepts it. `mintDevToken` signs with them and `verifyCallToken` checks them.
 * Boundary: data only. The issuer is under `.invalid` (RFC 2606), so no discovery document or key set is ever fetched
 *           for it and no real provider can hold it; the audience is no ZITADEL project id. Nothing here is a secret:
 *           the private key stays in the workspace's `.stackra/dev-issuer.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer); ADR 0170 (decision 5: `dev` is
 *                     a developer machine only).
 */

/**
 * The dev issuer's facts.
 *
 * @example
 * const claims = await verifyBearerToken(token, { issuer: DEV_ISSUER.issuer, audience: DEV_ISSUER.audience, ... });
 */
export const DEV_ISSUER = Object.freeze({
  /** The `iss` of every dev token. */
  issuer: "https://dev-issuer.stackra.invalid",
  /** The `aud` of every dev token. */
  audience: "stackra-dev",
  /** The variable holding the dev issuer's public JWK Set, set by `stackra dev` only. */
  keysVariable: "STACKRA_DEV_ISSUER_KEYS",
  /** The only `STACKRA_ENVIRONMENT` that accepts the dev issuer: a developer machine under `stackra dev`. */
  environment: "dev",
  /** The JWS algorithm of the dev key (ECDSA P-256). */
  algorithm: "ES256",
} as const);
