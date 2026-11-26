/**
 * Stackra file contract:
 * Purpose: `TicketPolicy`, the example record rule of the "Sign-in and permissions" guide: a customer may close only a
 *          ticket they opened; staff are left to their grants.
 * Boundary: one method per verb that needs a record rule (`close`); a verb without a method abstains. Runs after the
 *           permission check, on `ctx.authorize(ticket)`; it never grants what a role does not hold.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (record rules per model); ADR 0208; STA-2852.
 */
import { type Actor, Realm } from "@stackra/contracts";
import { Decision, Policy } from "@stackra/iam";

import type { Ticket } from "./ticket.model";

/** Record rules for tickets. */
export class TicketPolicy extends Policy<Ticket> {
  /** A customer closes only their own ticket; anyone else is left to their grants. */
  close(actor: Actor, ticket: Ticket): Decision {
    const subject = actor.onBehalfOf ?? actor;
    if (subject.realm !== Realm.Customer) return Decision.Abstain;
    return ticket.customerId === subject.id ? Decision.Abstain : Decision.Deny;
  }
}
