/**
 * Stackra file contract:
 * Purpose: `RollUpTimeSeriesOutput`, the counts of one `data_maintenance.timeseries.rollup` run: bucket rows written
 *          and expired rows removed, over every series and grain.
 * Boundary: a schema; the per-table counts go to the audit entry.
 * Runtime: node
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0305 (rule 28: the job surface); ADR 0462 (decision 1).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The counts of one run. */
export class RollUpTimeSeriesOutput extends Schema {
  /** Bucket rows written for the recomputed windows. */
  @Int({ min: 0 })
  written!: number;

  /** Rollup rows removed past their grain's retention. */
  @Int({ min: 0 })
  pruned!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RollUpTimeSeriesOutput,
    z.object({
      written: z.number().int().min(0),
      pruned: z.number().int().min(0),
    }),
  ],
]);
