/**
 * Stackra file contract:
 * Purpose: `ClaimsActionInput`, what `IdpAdmin.installClaimsAction` takes: the HTTPS endpoint the identity service
 *          serves the Stackra claims at, and how long the provider waits for it.
 * Boundary: a type only. The endpoint answers the provider's signed call with `claimsActionResponse`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2 and 3: the provider adds the Stackra claims); STA-2558.
 */

/** Where the claims action calls. */
export interface ClaimsActionInput {
  /** The identity service's claims endpoint (`https://id.figentra.com/api/identity/claims`). */
  readonly endpoint: string;

  /** Seconds the provider waits for the endpoint before the token fails; 10 when absent. */
  readonly timeoutSeconds?: number;
}
