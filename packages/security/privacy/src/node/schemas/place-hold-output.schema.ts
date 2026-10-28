/**
 * Stackra file contract:
 * Purpose: `PlaceHoldOutput`, what `hold.place` answers: the new hold's public id.
 * Boundary: a schema.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The placed hold. */
export class PlaceHoldOutput extends Schema {
  /** The hold's public id (`lgh_`), which releasing it names. */
  holdId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PlaceHoldOutput, z.object({ holdId: z.string().min(1) })]]);
