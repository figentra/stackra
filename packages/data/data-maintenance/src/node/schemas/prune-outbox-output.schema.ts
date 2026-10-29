/**
 * Stackra file contract:
 * Purpose: `PruneOutboxOutput`, what one outbox prune did: how many dead-lettered messages it deleted.
 * Boundary: a schema class of counts only; the inbox prune reports no count (its port returns none).
 * Runtime: node
 * Governing contract: ADR 0305 (rules 10 to 13, 28); data-layer gap gov6.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The counts of one run. */
export class PruneOutboxOutput extends Schema {
  /** Dead-lettered messages deleted. */
  @Int({ min: 0 })
  dead!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PruneOutboxOutput, z.object({ dead: z.number().int().min(0) })]]);
