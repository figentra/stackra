/**
 * Stackra file contract:
 * Purpose: `MaintainPartitionsOutput`, what one partition maintenance run did across the registered `Partitioned`
 *          models: how many partitions it created and dropped, and how many expired ones a legal hold kept.
 * Boundary: a schema class of counts only; the partition names go to the call's audit fields.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); data-layer gaps db12, sc4; ADR 0134 (holds).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The counts of one run. */
export class MaintainPartitionsOutput extends Schema {
  /** Partitions created ahead. */
  @Int({ min: 0 })
  created!: number;

  /** Expired partitions dropped. */
  @Int({ min: 0 })
  dropped!: number;

  /** Expired partitions kept for a legal hold. */
  @Int({ min: 0 })
  held!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    MaintainPartitionsOutput,
    z.object({
      created: z.number().int().min(0),
      dropped: z.number().int().min(0),
      held: z.number().int().min(0),
    }),
  ],
]);
