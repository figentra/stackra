/**
 * Stackra file contract:
 * Purpose: `ReleaseHoldOutput`, what `hold.release` answers: whether a live hold was released.
 * Boundary: a schema.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The release's result. */
export class ReleaseHoldOutput extends Schema {
  /** False when no live hold of the tenant has the id (unknown, or released before). */
  released!: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ReleaseHoldOutput, z.object({ released: z.boolean() })]]);
