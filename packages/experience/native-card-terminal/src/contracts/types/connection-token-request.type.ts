/**
 * Stackra file contract:
 * Purpose: `ConnectionTokenRequest`, the event the `StackraCardTerminal` module sends when the Stripe SDK asks for a
 *          connection token; the answer goes back under the same `requestId`.
 * Boundary: a type only; carries no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decision 4).
 */

/** One token request from the SDK. */
export interface ConnectionTokenRequest {
  /** The module's id for this request. */
  readonly requestId: string;
}
