/**
 * Stackra file contract:
 * Purpose: `Recipient`, who a notification addresses: one principal by public id (`Recipient.principal(id)`), every
 *          member of one scope by the scope's id (`Recipient.scope(scope)`), or one mail address that has no account
 *          yet (`Recipient.address(email)`, an invitation).
 * Boundary: a frozen value class with a private constructor; two recipients of the same principal, scope or address
 *           are equal (`toEqual`). A principal's address and language are resolved by the delivery layer at send time
 *           (ADR 0134); an address recipient is the one exception, for a person with no principal (ADR 0422 as
 *           amended), and is kept trimmed and lower-cased. A scope is kept by its id alone, never by a level name (R-59).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (notifications); ADR 0135 (public ids); ADR 0134 (personal data is resolved, not
 *                     copied); ADR 0422 (decision 1 as amended: an address with no
 *                     account).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/**
 * A notification's addressee.
 *
 * @example
 * recipients(event: OrderPaid): Recipient[] {
 *   return [Recipient.principal(event.customerId)];
 * }
 */
export class Recipient {
  /** The principal addressed; `null` for a scope recipient. */
  readonly principalId: PublicId<"usr"> | null;

  /** The scope whose members are addressed; `null` for a principal recipient. */
  readonly scopeId: ScopeRef["id"] | null;

  /** The mail address of a person with no account; `null` for a principal or scope recipient. */
  readonly email: string | null;

  private constructor(
    principalId: PublicId<"usr"> | null,
    scopeId: ScopeRef["id"] | null,
    email: string | null = null,
  ) {
    this.principalId = principalId;
    this.scopeId = scopeId;
    this.email = email;
    Object.freeze(this);
  }

  /** One person, by their public id. */
  static principal(principalId: PublicId<"usr">): Recipient {
    return new Recipient(principalId, null);
  }

  /** Every member of `scope`, resolved by the delivery layer when it sends. */
  static scope(scope: ScopeRef): Recipient {
    return new Recipient(null, scope.id);
  }

  /**
   * A person with no account yet, by mail address (an invitation). Use `principal` whenever the person has one.
   *
   * @throws RangeError when `email` is not one mail address.
   */
  static address(email: string): Recipient {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254)
      throw new RangeError(
        `Recipient.address takes one mail address, got ${JSON.stringify(email)}`,
      );
    return new Recipient(null, null, normalized);
  }
}
