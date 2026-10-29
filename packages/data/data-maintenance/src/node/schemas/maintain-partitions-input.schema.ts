/**
 * Stackra file contract:
 * Purpose: `MaintainPartitionsInput`, the input of the partition maintenance job, which takes no fields.
 * Boundary: a schema class; registered here until gen writes the package's schema registration (STA-339).
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); data-layer gaps db12, sc4.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** No fields: the job maintains every registered `Partitioned` model. */
export class MaintainPartitionsInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[MaintainPartitionsInput, z.object({})]]);
