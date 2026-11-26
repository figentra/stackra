/**
 * Stackra file contract:
 * Purpose: the tests of the "Events and background jobs" guide's examples, through the real action pipeline of a
 *          testing app: escalating a ticket publishes `TicketEscalated` and queues nothing before the commit; the
 *          relay's drain runs the listener once, which pages for an outage only; the queue's drain files the report; a
 *          report the tool refuses is retried and, after every attempt, dead-lettered with one page instead; a failing
 *          listener never fails the action that published.
 * Boundary: test only; `support.wiring.ts` stands in for gen's output, the memory drivers (`.useDrivers("memory")`)
 *           stand in for the outbox, the queue and the on-call tool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0078 (decisions 2 to 4); ADR 0148; ADR 0269 (testing helpers); STA-2852.
 */
import { run } from "@stackra/actions/testing";
import { createTestingModule } from "@stackra/container/testing";
import { drainOutbox } from "@stackra/events/testing";
import { actors } from "@stackra/iam/testing";
import { JobOutcome, QueueService } from "@stackra/queue";
import { drainQueue, runJob } from "@stackra/queue/testing";
import { describe, expect, it } from "@stackra/testing";

import { EscalateTicketAction } from "../escalate-ticket.action";
import { EscalationDesk } from "../escalation-desk.port";
import { PageOnCallListener } from "../page-on-call.listener";
import { SendEscalationReportAction } from "../send-escalation-report.action";
import { TicketEscalated } from "../ticket-escalated.event";
import type { MemoryEscalationDeskDriver } from "./memory-escalation-desk.driver";
import { SupportModule } from "./support.wiring";

const TICKET = "tkt_01j9z3k4m5n6p7q8r9s0t1v2t1";

/** A testing app of the support module on the memory drivers, and its on-call tool. */
async function compile() {
  const app = await createTestingModule(SupportModule).useDrivers("memory").compile();
  return { app, desk: app.get(EscalationDesk) as MemoryEscalationDeskDriver };
}

describe("Events and background jobs guide", { timeout: 60_000 }, () => {
  it("publishes the event, pages from the listener and files the report from the job", async () => {
    const { app, desk } = await compile();
    // #region escalate
    const escalated = await run(
      EscalateTicketAction,
      { ticketId: TICKET, reason: "outage" },
      { as: actors.staff() },
    );
    expect(escalated.output).toEqual({ ticketId: TICKET });
    expect(escalated).toRecord(TicketEscalated, { ticketId: TICKET, reason: "outage" });
    // #endregion escalate

    // #region drain
    expect(desk.pages).toEqual([]); // nothing ran inside the call

    await drainOutbox(); // the relay hands the committed event to the listener
    expect(desk.pages).toEqual([`${TICKET}:outage`]);
    expect(app.listeners.calls(PageOnCallListener)).toHaveLength(1);

    await drainQueue(); // the worker runs the job the action queued after its commit
    expect(desk.reports).toEqual([TICKET]);
    // #endregion drain
  });

  it("pages only for an outage", async () => {
    const { desk } = await compile();
    await run(EscalateTicketAction, { ticketId: TICKET, reason: "vip" }, { as: actors.staff() });
    await drainOutbox();
    expect(desk.pages).toEqual([]);
  });

  it("retries a report the tool refuses, then dead-letters it with one page", async () => {
    const { app, desk } = await compile();
    // #region dead-letter
    desk.down = true;
    const job = await runJob(SendEscalationReportAction, { ticketId: TICKET });

    expect(job).toDeadLetter({ attempts: 5 }); // the first attempt and four retries
    expect(job.runs.map((attempt) => attempt.outcome)).toEqual([
      JobOutcome.Retried,
      JobOutcome.Retried,
      JobOutcome.Retried,
      JobOutcome.Retried,
      JobOutcome.DeadLettered,
    ]);
    expect(desk.pages).toEqual([`${TICKET}:report_failed`]); // markUnsent, once
    // #endregion dead-letter
    expect(desk.refused).toBe(5);

    // #region redrive
    desk.down = false;
    const queue = app.get(QueueService);
    for (const parked of await queue.deadLetters("support")) await queue.redrive(parked.id);
    await drainQueue();
    expect(desk.reports).toEqual([TICKET]);
    // #endregion redrive
  });

  it("never fails the action when its listener fails", async () => {
    const { app, desk } = await compile();
    desk.page = () => Promise.reject(new Error("pager down"));
    const escalated = await run(
      EscalateTicketAction,
      { ticketId: TICKET, reason: "outage" },
      { as: actors.staff() },
    );
    expect(escalated.ok).toBe(true);
    await drainOutbox();
    expect(app.listeners.failures(PageOnCallListener)).toHaveLength(1);
  });
});
