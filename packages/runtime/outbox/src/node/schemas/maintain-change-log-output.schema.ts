/**
 * Stackra file contract:
 * Purpose: `MaintainChangeLogOutput`, what one change log maintenance run did: how many daily partitions it created
 *          ahead and how many expired ones it dropped.
 * Boundary: a schema class of counts only.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); ADR 0078 and ADR 0221 (2026-10-28 amendment).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The counts of one run. */
export class MaintainChangeLogOutput extends Schema {
  /** Partitions created ahead. */
  @Int({ min: 0 })
  created!: number;

  /** Expired partitions dropped. */
  @Int({ min: 0 })
  dropped!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    MaintainChangeLogOutput,
    z.object({
      created: z.number().int().min(0),
      dropped: z.number().int().min(0),
    }),
  ],
]);
