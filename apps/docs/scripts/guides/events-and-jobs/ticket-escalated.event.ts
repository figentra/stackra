/**
 * Stackra file contract:
 * Purpose: `TicketEscalated`, the example event of the "Events and background jobs" guide: a ticket went to the
 *          on-call team, leaving through the outbox as `support.ticket.escalated.v1`.
 * Boundary: the payload only (ids and a code, never a person's data); the event id, time, tenant and actor travel
 *           beside it. Gen adds the module key and the version to the name, and writes its schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (event kinds); ADR 0294 (decision 27: the payload is the fields); ADR 0456 (decision 2);
 *                     STA-2852.
 */
import { IntegrationEvent } from "@stackra/events";

/** A ticket was handed to the on-call team. */
export class TicketEscalated extends IntegrationEvent({ name: "ticket.escalated" }) {
  /** The escalated ticket. */
  ticketId!: string;

  /** Why: `outage`, `security` or `vip`. */
  reason!: string;
}
