/**
 * Stackra file contract:
 * Purpose: `SendEscalationReportAction`, `support.escalation.send_report@1`, the example job of the "Events and
 *          background jobs" guide: it files the full report with the on-call tool, retried with backoff while the tool
 *          is down, and parked in the dead-letter queue when every attempt failed, paging a person instead (`markUnsent`, called
 *          once).
 * Boundary: an action with a `job` option: the queue worker runs each attempt through the action pipeline, in the
 *           scope of the call that queued it, as the `job` actor acting for that caller.
 * Runtime: node
 * Governing contract: ADR 0148 (the queue: retries, backoff, dead letters); ADR 0305 (rule 28); STA-2852.
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";

import type { EscalationDesk } from "./escalation-desk.port";
import { Queues } from "./queues";

/** Files an escalation report in the background. */
export class SendEscalationReportAction extends Action({
  key: "escalation.send_report",
  actors: [ActorKind.Job],
  job: {
    queue: Queues.Support,
    retries: 4,
    backoff: Backoff.Exponential,
    timeout: "PT1M",
    deadLetter: true,
    onDeadLetter: "markUnsent",
  },
}) {
  /** The on-call tool. */
  private readonly desk: EscalationDesk;

  /**
   * @param desk - the on-call tool.
   */
  constructor(desk: EscalationDesk) {
    super();
    this.desk = desk;
  }

  /** One attempt: files the report, or throws so the queue retries. */
  async handle(input: { ticketId: string }): Promise<void> {
    await this.desk.report(input.ticketId);
  }

  /** Called once, after the last attempt failed: a person follows the ticket up instead. */
  async markUnsent(input: { ticketId: string }): Promise<void> {
    await this.desk.page(input.ticketId, "report_failed");
  }
}
