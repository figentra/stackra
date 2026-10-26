/**
 * Stackra file contract:
 * Purpose: the IdentityResolver port: turns a principal id into the address to write to, or into the whole verified
 *          principal (address, verified phone, locale, time zone), and a verified address back into its principal, so
 *          no service stores a person's address or number.
 * Boundary: an abstract class that is its own token; `@stackra/identity` ships the driver over the identity provider
 *           and the fake. Only verified addresses and phone numbers are answered: an unverified one resolves to nobody
 *           and is never returned.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0206 (identity is provider-neutral), ADR 0134 (personal
 *                     data is resolved, not copied); ADR 0414 (decision 1).
 */
import { Port } from "#core/bases/port.base";
import type { Email } from "#core/types/email.type";
import type { PublicId } from "#core/types/public-id.type";
import type { VerifiedPrincipal } from "#core/types/verified-principal.type";

/** Answers who a principal is, from the identity provider. */
export abstract class IdentityResolver extends Port {
  /**
   * The verified address of a principal, read at the moment of sending.
   *
   * @throws when the principal is unknown or has no verified address.
   */
  abstract emailOf(principalId: PublicId<"usr">): Promise<Email>;

  /**
   * The principal with everything a message to them needs (verified address and phone, locale, time zone), read at
   * the moment of sending.
   *
   * @throws when the principal is unknown or has no verified address.
   */
  abstract principalOf(principalId: PublicId<"usr">): Promise<VerifiedPrincipal>;

  /** The principal whose verified address is `email` (compared case-insensitively), or `null` when none is. */
  abstract principalByVerifiedEmail(email: Email): Promise<VerifiedPrincipal | null>;
}
