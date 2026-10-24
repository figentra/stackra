/**
 * Stackra file contract:
 * Purpose: `CspAdditions`, what the runtime adds to one response's policy on top of `CspConfig`: the origins it
 *          derives from the environment for `connect-src`, and the request's nonce.
 * Boundary: a type only. The values come from the runtime (env, the middleware), never from a request.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0251 (desktop hardening).
 */

/** The per-response additions of `contentSecurityPolicy`. */
export interface CspAdditions {
  /** `connect-src` sources from the environment (the API gateway, realtime, error reporting); a URL counts by origin. */
  readonly connect?: readonly string[];

  /** The request's nonce from `createNonce`; without one, scripts and `<style>` elements load from the origin only. */
  readonly nonce?: string;
}
