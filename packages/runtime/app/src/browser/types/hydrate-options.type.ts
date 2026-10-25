/**
 * Stackra file contract:
 * Purpose: `HydrateOptions`, what `BrowserApp.hydrate` takes: the CSP nonce the server rendered, read back from the
 *          document, so the scripts React Router writes on the client carry the same nonce.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 8); ADR 0297 (web runtime); the CSP rules of @stackra/csp.
 */

/** The options of `BrowserApp.hydrate`. */
export interface HydrateOptions {
  /** The request's CSP nonce; empty when the page carries none. */
  readonly nonce?: string;
}
