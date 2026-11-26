/**
 * Stackra file contract:
 * Purpose: `PageOnCallListener`, the example listener of the "Events and background jobs" guide: on `TicketEscalated`
 *          for an outage it pages whoever is on call.
 * Boundary: subscribed by the type of `handle`'s first parameter (gen writes `registerListeners`); runs after the
 *           commit, once per event id. A failure is recorded on its delivery and never reaches the action that
 *           published the event.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 2 to 4: listeners run after commit); ADR 0294; STA-2852.
 */
import { Listener, type ListenerContext } from "@stackra/events";

import type { EscalationDesk } from "./escalation-desk.port";
import type { TicketEscalated } from "./ticket-escalated.event";

/** Pages on call when an outage is escalated. */
export class PageOnCallListener extends Listener {
  /** The on-call tool. */
  private readonly desk: EscalationDesk;

  /**
   * @param desk - the on-call tool.
   */
  constructor(desk: EscalationDesk) {
    super();
    this.desk = desk;
  }

  /** Pages for an outage; other reasons wait for the report. */
  async handle(event: TicketEscalated, ctx: ListenerContext): Promise<void> {
    if (event.reason !== "outage") return;
    await this.desk.page(event.ticketId, event.reason);
    ctx.audit({ ticketId: event.ticketId });
  }
}
