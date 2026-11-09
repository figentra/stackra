/**
 * Stackra file contract:
 * Purpose: `StartTriggeredAutomationsInput`, the input of `workflow.automation.start_triggered`: one trigger occurrence
 *          as its delivery saw it, the block, the event id and correlation, and the occurrence itself as JSON.
 * Boundary: a schema class; registered with its Zod shape here until gen writes the package's registration. Written by
 *           the trigger listener only, never by a caller: the action has no user actor and no endpoint.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0122 (decision 3).
 */
import type { Json } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** One trigger occurrence to start the automations of. */
export class StartTriggeredAutomationsInput extends Schema {
  /** The trigger building block's key (`orders.order_paid`). */
  block!: string;

  /** The occurrence's event id. */
  eventId!: string;

  /** The delivery's correlation, which places each start in its event chain; absent when none. */
  correlationId?: string;

  /** The occurrence as JSON, each run's input. */
  occurrence!: Json;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    StartTriggeredAutomationsInput,
    z.object({
      block: z.string().min(1),
      eventId: z.string().min(1),
      correlationId: z.string().min(1).exactOptional(),
      occurrence: z.json(),
    }),
  ],
]);
