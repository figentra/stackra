/**
 * Stackra file contract:
 * Purpose: the stand-in for the schema `stackra gen` writes into `#stackra/schemas` for the "Notifications" guide's
 *          trigger, so `TicketAnswered.create({...})` checks its payload as it does in an app.
 * Boundary: test support only; loading it registers the schema once.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15: gen writes the schemas); ADR 0078; STA-2852.
 */
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { TicketAnswered } from "../ticket-answered.event";

registerSchemas([[TicketAnswered, z.object({ ticketId: z.string(), customerId: z.string() })]]);
