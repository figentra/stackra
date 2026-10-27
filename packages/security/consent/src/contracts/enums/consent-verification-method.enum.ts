/**
 * Stackra file contract:
 * Purpose: `ConsentVerificationMethod`, how a consent given for another person is verified beyond the relationship
 *          record: a small card check on the giver's card, a signed consent form, or the guardian signing in.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry because `ConsentVerifier`'s request
 *           names it. Which method a market requires is market-pack data (a legal floor, such as a parental consent
 *           rule), read by the caller with `valueOf(pack, key, on)`; never a branch on a market here. Labels are the
 *           derived i18n keys `consent::enums.consent_verification_method.<code>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences: the verification method port); review round 2 A2-2; ADR 0370 (legal
 *                     floors are pack data); ADR 0231 (snake_case codes); STA-1323.
 */
import { Enum } from "@stackra/contracts";

/**
 * One case per method.
 *
 * @example
 * const method = valueOf(pack, "consent.guardian_verification", today).value as ConsentVerificationMethod;
 */
export const ConsentVerificationMethod = Enum.of({
  /** A small charge or authorisation on the giver's payment card, voided after the check. */
  CardCheck: "card_check",
  /** A consent form the giver signed (on paper or electronically), kept by the owning service. */
  SignedForm: "signed_form",
  /** The guardian signs in to their own account and confirms. */
  GuardianLogin: "guardian_login",
});

/** One of the codes above. */
export type ConsentVerificationMethod = Enum.Value<typeof ConsentVerificationMethod>;
