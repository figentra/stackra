/**
 * Stackra file contract:
 * Purpose: `PlaceHoldInput`, what `hold.place` takes: the held record's model and id (or a subject's public id) and
 *          why it is held.
 * Boundary: a schema; the model is the entity name the hold registry is asked with (`Invoice`).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** A hold to place. */
export class PlaceHoldInput extends Schema {
  /** The entity name of the held record's model. */
  @Str({
    min: 1,
    max: 127,
  })
  model!: string;

  /** The held record's id, or a subject's public id to hold every record linked to it. */
  @Str({
    min: 1,
    max: 255,
  })
  recordId!: string;

  /** Why it is held: the matter or request. */
  @Str({
    min: 1,
    max: 1000,
  })
  reason!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PlaceHoldInput,
    z.object({
      model: z.string().min(1).max(127),
      recordId: z.string().min(1).max(255),
      reason: z.string().min(1).max(1000),
    }),
  ],
]);
