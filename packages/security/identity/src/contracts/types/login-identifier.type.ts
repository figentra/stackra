/**
 * Stackra file contract:
 * Purpose: `LoginIdentifier`, one sign-in identifier as a person typed or a region's identity service holds it: its
 *          kind and its value before normalisation.
 * Boundary: type only. Personal data: it is hashed by `loginDirectoryPrefix` and never stored or logged in clear by
 *           the directory.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 4); ADR 0451.
 */
import type { LoginIdentifierKind } from "#contracts/enums/login-identifier-kind.enum";

/** One sign-in identifier. */
export type LoginIdentifier = {
  /** Which kind of identifier this is: an email address or a phone number. */
  readonly kind: LoginIdentifierKind;
  /** The identifier as typed or held, before normalisation. */
  readonly value: string;
};
