/**
 * Stackra file contract:
 * Purpose: `VerifiedPrincipal`: a person the identity provider knows, with the address it has verified and the
 *          language to write to them in, as `IdentityResolver` returns them.
 * Boundary: a type only. The address is resolved at the moment of use and never stored by the caller (ADR 0134).
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (identity is provider-neutral), ADR 0134 (personal data), ADR 0135 (public ids).
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
};
