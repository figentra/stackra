/**
 * Stackra file contract:
 * Purpose: `ClaimsActionInstall`, what `IdpAdmin.installClaimsAction` answers: the provider's target id and, on the
 *          first install only, the key the provider signs each call with.
 * Boundary: a type only. `signingKey` is shown once: the caller stores it in the secret store at once, and never logs
 *           it or keeps it in a record. A later install updates the target and keeps its key.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 3); ADR 0173 (secrets); STA-2558.
 */

/** An installed claims action. */
export interface ClaimsActionInstall {
  /** The provider's id of the claims target. */
  readonly targetId: string;

  /** The HMAC key of the provider's `ZITADEL-Signature`; set only when this install created the target. */
  readonly signingKey?: string;
}
