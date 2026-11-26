/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes for the guide's `support` module in an app: the `Ticket` entity
 *          metadata (`.stackra/gen/entities/support.ts`, in gen's shape) and the `TicketService` partner registration
 *          (the generated test setup), so the guide's tests run the example files unchanged.
 * Boundary: test support only; loading it registers the entity and the partner. Columns, indexes, keys and the
 *           tenant policy are the migration's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15: gen writes the entities); ADR 0305 (partners); STA-2843.
 */
import {
  EntitySchema,
  type OptionalProps,
  registerEntities,
  registerModelPartners,
} from "@stackra/database";

import { Ticket } from "../ticket.model";
import { TicketService } from "../ticket.service";

declare module "../ticket.model" {
  interface Ticket {
    [OptionalProps]?: "createdAt" | "id" | "status" | "tenantId" | "updatedAt";
  }
}

/** `support.ticket` (ticket.model.ts). */
export const TicketSchema = new EntitySchema<Ticket>({
  class: Ticket,
  schema: "support",
  tableName: "tickets",
  properties: {
    subject: { type: "string" },
    status: { type: "string", default: "open" },
    id: { type: "string", primary: true },
    tenantId: { type: "string" },
    createdAt: { type: "datetime" },
    updatedAt: { type: "datetime", onUpdate: () => new Date() },
  },
});

registerEntities([TicketSchema]);
registerModelPartners([[TicketService, Ticket]]);
