/**
 * Stackra file contract:
 * Purpose: `ForwardedFactsOptions`, the second argument of `forwardedFacts`: the key the visitor's address is signed
 *          with.
 * Boundary: a type only; the key is a secret (`GATEWAY_VISITOR_SIGNING_KEY`) read from the Worker's validated env,
 *           never logged.
 * Runtime: worker
 * Governing contract: ADR 0237 (generated gateway); ADR 0173 (secrets).
 */

/** How to sign the forwarded facts. */
export interface ForwardedFactsOptions {
  /** The HMAC key the gateway verifies the visitor's address with. */
  readonly signingKey: string;
}
