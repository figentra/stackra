/**
 * Stackra file contract:
 * Purpose: `ListHoldsInput`, what `hold.list` takes: optionally one record (or subject) id, and whether released holds
 *          are listed too.
 * Boundary: a schema.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** Which holds to list. */
export class ListHoldsInput extends Schema {
  /** Only the holds on this record or subject id; every hold when absent. */
  @Str({
    min: 1,
    max: 255,
  })
  recordId?: string;

  /** Whether released holds are listed too; live ones only when absent. */
  includeReleased?: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ListHoldsInput,
    z.object({
      recordId: z.string().min(1).max(255).optional(),
      includeReleased: z.boolean().optional(),
    }),
  ],
]);
