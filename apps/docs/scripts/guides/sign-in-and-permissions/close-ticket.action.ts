/**
 * Stackra file contract:
 * Purpose: `CloseTicketAction`, `support.ticket.close@1`, the example action of the "Sign-in and permissions" guide:
 *          the pipeline checks the caller holds `support.ticket.close` where the call acts, then `ctx.authorize`
 *          runs the ticket policy on the ticket before it closes.
 * Boundary: single aggregate, inline `handle`; its permission is `TicketPermissions.close` (L2), derived from the key.
 *           The caller is `ctx.actor`, made by the server from the verified token, never from input.
 * Runtime: node
 * Governing contract: ADR 0098 (actions and the actor); ADR 0138 as amended (the permission step); ADR 0132 (record
 *                     rules on `ctx.authorize`); STA-2852.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { Ticket } from "./ticket.model";
import type { TicketService } from "./ticket.service";

/** Closes a ticket for a signed-in user who may. */
export class CloseTicketAction extends Action({
  key: "ticket.close",
  actors: [ActorKind.User],
}) {
  /** Reads and closes the ticket. */
  private readonly tickets: TicketService;

  /**
   * @param tickets - reads and closes the ticket.
   */
  constructor(tickets: TicketService) {
    super();
    this.tickets = tickets;
  }

  /** Closes the ticket once the policy allows this caller to close this ticket. */
  async handle(input: { ticketId: Ticket["id"] }, ctx: ActionContext): Promise<{ status: string }> {
    const ticket = await this.tickets.get(input.ticketId);
    await ctx.authorize(ticket);
    const closed = await this.tickets.close(ticket.id);
    return { status: closed.status };
  }
}
