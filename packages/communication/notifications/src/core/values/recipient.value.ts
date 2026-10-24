/**
 * Stackra file contract:
 * Purpose: `Recipient`, who a notification addresses: one principal by public id (`Recipient.principal(id)`), or every
 *          member of one scope by the scope's id (`Recipient.scope(scope)`).
 * Boundary: a frozen value class with a private constructor; two recipients of the same principal or scope are equal
 *           (`toEqual`). It holds ids only: the address and the language are resolved by the delivery layer at send
 *           time (ADR 0134), and a scope is kept by its id alone, never by a level name (R-59).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (notifications); ADR 0135 (public ids); ADR 0134 (personal data is resolved, not
 *                     copied).
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

  private constructor(principalId: PublicId<"usr"> | null, scopeId: ScopeRef["id"] | null) {
    this.principalId = principalId;
    this.scopeId = scopeId;
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
}
