/**
 * Stackra file contract:
 * Purpose: the IdentityResolver port: turns a principal id into the address to write to, and a verified address back
 *          into its principal, so no service stores a person's address.
 * Boundary: an abstract class that is its own token; `@stackra/identity` ships the driver over the identity provider
 *           and the fake. Only verified addresses are answered: an unverified one resolves to nobody.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0206 (identity is provider-neutral), ADR 0134 (personal
 *                     data is resolved, not copied).
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

  /** The principal whose verified address is `email` (compared case-insensitively), or `null` when none is. */
  abstract principalByVerifiedEmail(email: Email): Promise<VerifiedPrincipal | null>;
}
