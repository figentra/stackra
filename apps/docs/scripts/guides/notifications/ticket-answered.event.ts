/**
 * Stackra file contract:
 * Purpose: `TicketAnswered`, the trigger of the "Notifications" guide's notification: an agent answered a ticket
 *          (`support.ticket.answered.v1`).
 * Boundary: the payload only, ids, never a person's data; the event id, time, tenant and actor travel beside it.
 * Runtime: isomorphic
 * Governing contract: ADR 0078; ADR 0294 (decision 27); STA-2852.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";

/** An agent answered a ticket. */
export class TicketAnswered extends IntegrationEvent({ name: "ticket.answered" }) {
  /** The answered ticket. */
  ticketId!: PublicId<"tkt">;

  /** The customer who opened it. */
  customerId!: PublicId<"usr">;
}
