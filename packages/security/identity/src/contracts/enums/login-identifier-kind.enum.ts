/**
 * Stackra file contract:
 * Purpose: `LoginIdentifierKind`, what a person types to sign in and the login directory routes by: an email address
 *          or a phone number.
 * Boundary: an `Enum.of` value plus the type of the same name. The code is part of every directory key
 *           (`dir:<key id>:<kind>:<hash>:<region>`), so a code never changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 4); ADR 0451.
 */
import { Enum } from "@stackra/contracts";

/** The kinds of sign-in identifier the login directory holds. */
export const LoginIdentifierKind = Enum.of({
  /** An email address, compared lower-cased. */
  Email: "email",
  /** A phone number in E.164 form. */
  Phone: "phone",
});

/** One of the codes above. */
export type LoginIdentifierKind = Enum.Value<typeof LoginIdentifierKind>;
