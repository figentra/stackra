/**
 * Stackra file contract:
 * Purpose: `PruneRecordsInput`, the input of the retention job, which takes no fields.
 * Boundary: a schema class; registered here until gen writes the package's schema registration (STA-339).
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); ADR 0134 (decision 3); data-layer gap gov4.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** No fields: the job prunes every registered model with a retention. */
export class PruneRecordsInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PruneRecordsInput, z.object({})]]);
