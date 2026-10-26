/**
 * Stackra file contract:
 * Purpose: `IdpUserInput`, what `IdpAdmin.createUser` takes: the organisation, the login name, the person's names and
 *          email, and whether the email is already verified.
 * Boundary: a type only; personal data, so a driver sends it to the identity provider and never logs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0410 (STA-834).
 */

/** A human user to create. */
export interface IdpUserInput {
  /** The identity provider's organisation id (one per tenant). */
  readonly organizationId: string;

  /** The login name, unique in the organisation. */
  readonly username: string;

  /** The given name. */
  readonly givenName: string;

  /** The family name. */
  readonly familyName: string;

  /** The email address. */
  readonly email: string;

  /** `true` when the caller already proved the address, so the provider sends no verification mail. */
  readonly emailVerified?: boolean;
}
