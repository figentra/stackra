/**
 * Stackra file contract:
 * Purpose: `IdpMachineCredential`, what `IdpAdmin.createMachineUser` answers: the new machine user's id and its
 *          client-credentials pair.
 * Boundary: a type only. `clientSecret` is shown once: the caller hands it to the device or stores it in the secret
 *           store at once, and never logs it or keeps it in a record.
 * Runtime: isomorphic
 * Governing contract: ADR 0207; ADR 0235 (decision 1: `device_credential.issued`); ADR 0410 (STA-834).
 */

/** A new machine user and its credential. */
export interface IdpMachineCredential {
  /** The provider's user id. */
  readonly userId: string;

  /** The OAuth client id of the client-credentials grant. */
  readonly clientId: string;

  /** The OAuth client secret; shown once. */
  readonly clientSecret: string;
}
