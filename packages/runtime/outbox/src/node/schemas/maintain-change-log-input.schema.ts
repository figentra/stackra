/**
 * Stackra file contract:
 * Purpose: `MaintainChangeLogInput`, the input of the change log maintenance job, which takes no fields.
 * Boundary: a schema class; registered here until gen writes the package's schema registration (STA-339).
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); ADR 0078 and ADR 0221 (2026-10-28 amendment).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** No fields: the job maintains the service's one change log. */
export class MaintainChangeLogInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[MaintainChangeLogInput, z.object({})]]);
