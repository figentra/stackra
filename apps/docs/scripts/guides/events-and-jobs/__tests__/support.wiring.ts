/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes for the guide's `support` module in an app: the event's schema
 *          (`#stackra/schemas`), the listener registration (`registerListeners`), and the module's wiring (its actions,
 *          listener and queue services, the `EscalationDesk` driver and the queue behind `ctx.dispatch`).
 * Boundary: test support only; loading it registers all of the above once. `SupportModule` is the testing root.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15: gen writes the registrations and the wiring); ADR 0078; ADR 0148;
 *                     STA-2852.
 */
import { JobDispatcher } from "@stackra/actions/contracts";
import { Module } from "@stackra/container";
import { registerWiring } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { registerListeners } from "@stackra/events";
import { QueueDriver } from "@stackra/queue/contracts";
import { MemoryQueueDriver, QueueJobDispatcherDriver, QueueService } from "@stackra/queue";
import { QueueWorkerService } from "@stackra/queue/node";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { EscalateTicketAction } from "../escalate-ticket.action";
import { EscalationDesk } from "../escalation-desk.port";
import { PageOnCallListener } from "../page-on-call.listener";
import { SendEscalationReportAction } from "../send-escalation-report.action";
import { TicketEscalated } from "../ticket-escalated.event";
import { MemoryEscalationDeskDriver } from "./memory-escalation-desk.driver";

/** The guide's module. */
export class SupportModule extends Module {}

registerSchemas([[TicketEscalated, z.object({ ticketId: z.string(), reason: z.string() })]]);
registerListeners([[TicketEscalated, PageOnCallListener]]);
registerWiring({
  member: "support",
  root: SupportModule,
  bindings: [
    { module: "support", provide: EscalateTicketAction, deps: [] },
    { module: "support", provide: SendEscalationReportAction, deps: [EscalationDesk] },
    { module: "support", provide: PageOnCallListener, deps: [EscalationDesk] },
    { module: "support", provide: QueueService, deps: [QueueDriver, Clock] },
    { module: "support", provide: QueueWorkerService, deps: [QueueDriver, Clock] },
  ],
  drivers: [
    { port: QueueDriver, candidates: { memory: async () => MemoryQueueDriver } },
    {
      port: JobDispatcher,
      candidates: { memory: async () => QueueJobDispatcherDriver },
      deps: { memory: [QueueService] },
    },
    { port: EscalationDesk, candidates: { memory: async () => MemoryEscalationDeskDriver } },
  ],
});
