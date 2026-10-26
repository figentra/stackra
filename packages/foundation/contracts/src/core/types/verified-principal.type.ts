/**
 * Stackra file contract:
 * Purpose: `VerifiedPrincipal`: a person the identity provider knows, with the address it has verified, the phone
 *          number it has verified (when it has one), the language to write to them in and their time zone, as
 *          `IdentityResolver` returns them: what a notification needs for email, SMS or WhatsApp and quiet hours.
 * Boundary: a type only. Address and phone are resolved at the moment of use and never stored by the caller
 *           (ADR 0134). An unverified phone is never returned. A principal with no time zone of their own is left
 *           without one, and the caller falls back to the tenant's or the location's.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (identity is provider-neutral), ADR 0134 (personal data), ADR 0135 (public ids);
 *                     ADR 0414 (decision 1).
 */
import type { Email } from "#core/types/email.type";
import type { PublicId } from "#core/types/public-id.type";

/** A principal and the facts a message to them needs. */
export type VerifiedPrincipal = {
  /** The principal's public id. */
  readonly id: PublicId<"usr">;
  /** The address the identity provider verified. */
  readonly email: Email;
  /** The principal's preferred language, a BCP 47 tag such as `en` or `ar-SA`. */
  readonly locale: string;
  /** The phone number the identity provider verified, in E.164 (`+201001234567`); absent when none is verified. */
  readonly phone?: string;
  /** The principal's IANA time zone (`Africa/Cairo`); absent when they set none. */
  readonly timeZone?: string;
};
