/**
 * Stackra file contract:
 * Purpose: `PruneOutboxInput`, the input of the outbox prune job, which takes no fields.
 * Boundary: a schema class; registered here until gen writes the package's schema registration (STA-339).
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); data-layer gap gov6.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** No fields: the job prunes the service's one outbox and inbox. */
export class PruneOutboxInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PruneOutboxInput, z.object({})]]);
