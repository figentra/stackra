/**
 * Stackra file contract:
 * Purpose: `CspAdditions`, what the runtime adds to one response's policy on top of `CspConfig`: the origins it
 *          derives from the environment for `connect-src`, the request's nonce, the request's path, and the framers a
 *          per-request resolver found for a `"request"` path.
 * Boundary: a type only. The values come from the runtime (env, the middleware, a resolver over stored data such as a
 *           merchant's registered embed origins), never from request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0251 (desktop hardening).
 */

/** The per-response additions of `contentSecurityPolicy`. */
export interface CspAdditions {
  /** `connect-src` sources from the environment (the API gateway, realtime, error reporting); a URL counts by origin. */
  readonly connect?: readonly string[];

  /** The request's nonce from `createNonce`; without one, scripts and `<style>` elements load from the origin only. */
  readonly nonce?: string;

  /** The request's URL path (`url.pathname`); it picks the `frameAncestors` entry. Without one, no page may frame. */
  readonly path?: string;

  /** The framers a resolver found for this request, on a `"request"` path only; none (an unknown session) is `'none'`. */
  readonly frameAncestors?: readonly string[];
}
