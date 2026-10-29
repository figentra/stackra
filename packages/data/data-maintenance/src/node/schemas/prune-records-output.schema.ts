/**
 * Stackra file contract:
 * Purpose: `PruneRecordsOutput`, what one retention run did in its scope across the registered models: rows archived
 *          or soft-deleted, rows deleted for good, and rows a legal hold kept.
 * Boundary: a schema class of counts only; the per-model counts go to the call's audit fields.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); ADR 0134 (decision 3); data-layer gap gov4.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The counts of one run. */
export class PruneRecordsOutput extends Schema {
  /** Expired rows archived or soft-deleted. */
  @Int({ min: 0 })
  expired!: number;

  /** Rows deleted for good. */
  @Int({ min: 0 })
  purged!: number;

  /** Rows a legal hold kept. */
  @Int({ min: 0 })
  held!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PruneRecordsOutput,
    z.object({
      expired: z.number().int().min(0),
      purged: z.number().int().min(0),
      held: z.number().int().min(0),
    }),
  ],
]);
