/**
 * Stackra file contract:
 * Purpose: `EscalateTicketAction`, `support.ticket.escalate@1`, the example action of the "Events and background jobs"
 *          guide: it publishes `TicketEscalated` in its unit of work and, once the call commits, queues the slow
 *          report as `SendEscalationReportAction`.
 * Boundary: no external call inside the transaction: the event leaves through the outbox only if the call commits,
 *           and the job is queued after the commit in the call's scope.
 * Runtime: node
 * Governing contract: ADR 0098; ADR 0456 (decision 2: `ctx.publish`); ADR 0148 and ADR 0305 (rule 28: jobs);
 *                     STA-2852.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { SendEscalationReportAction } from "./send-escalation-report.action";
import { TicketEscalated } from "./ticket-escalated.event";

/** Hands a ticket to the on-call team. */
export class EscalateTicketAction extends Action({
  key: "ticket.escalate",
  actors: [ActorKind.User],
}) {
  /** Publishes the event now and queues the report for after the commit. */
  async handle(
    input: { ticketId: string; reason: string },
    ctx: ActionContext,
  ): Promise<{ ticketId: string }> {
    await ctx.publish(TicketEscalated.create({ ticketId: input.ticketId, reason: input.reason }));
    ctx.afterCommit(() => ctx.dispatch(SendEscalationReportAction, { ticketId: input.ticketId }));
    return { ticketId: input.ticketId };
  }
}
