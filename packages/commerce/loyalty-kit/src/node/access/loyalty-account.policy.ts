/**
 * Stackra file contract:
 * Purpose: `LoyaltyAccountPolicy`, the record rules for loyalty accounts: each method is named after a verb of
 *          `LoyaltyAccountPermissions` and refines that permission for one account.
 * Boundary: a pure decision (allow, deny or abstain); no writes, no network. It runs inside `handle` through
 *           `ctx.authorize(account)`, after the permission step passed, so a method exists only where a verb needs a
 *           record rule: `expire`, which runs scope-wide as the job, has none. The model is the type argument
 *           (`Policy<LoyaltyAccount>`) and its permissions are found by name, so nothing is passed in. The subject is
 *           `actor.onBehalfOf ?? actor`, so a service or an agent acting for a customer is held to that customer.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 23); ADR 0305; ADR 0132 (decision 4, as amended); ADR 0098.
 */
import { type Actor, Realm } from "@stackra/contracts";
import { Decision, Policy } from "@stackra/iam";

import type { LoyaltyAccount } from "#node/models/loyalty-account.model";

/**
 * `Deny` beats a granted permission; `Abstain` leaves the permission as the whole answer.
 *
 * @example
 * await ctx.authorize(account); // runs LoyaltyAccountPolicy#<verb of the call's permission>
 */
export class LoyaltyAccountPolicy extends Policy<LoyaltyAccount> {
  /** A customer reads only their own account; every other realm is left to the permission. */
  read(actor: Actor, account: LoyaltyAccount): Decision {
    const subject = actor.onBehalfOf ?? actor;
    return subject.realm === Realm.Customer && account.memberId !== subject.id
      ? Decision.Deny
      : Decision.Abstain;
  }

  /** Nobody redeems from a frozen account; a customer only from their own. */
  redeem(actor: Actor, account: LoyaltyAccount): Decision {
    if (!account.canTransact) return Decision.Deny;
    return this.read(actor, account);
  }

  /** Freezing is staff-only by permission; the policy only refuses a deleted account. */
  freeze(_actor: Actor, account: LoyaltyAccount): Decision {
    return account.deletedAt ? Decision.Deny : Decision.Abstain;
  }
}
