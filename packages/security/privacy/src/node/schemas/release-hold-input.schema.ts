/**
 * Stackra file contract:
 * Purpose: `ReleaseHoldInput`, what `hold.release` takes: the hold and why it is released.
 * Boundary: a schema.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** A hold to release. */
export class ReleaseHoldInput extends Schema {
  /** The hold's public id. */
  @Str({
    min: 1,
    max: 63,
  })
  holdId!: string;

  /** Why it is released: the matter closed, the request withdrawn. */
  @Str({
    min: 1,
    max: 1000,
  })
  reason!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ReleaseHoldInput,
    z.object({ holdId: z.string().min(1).max(63), reason: z.string().min(1).max(1000) }),
  ],
]);
