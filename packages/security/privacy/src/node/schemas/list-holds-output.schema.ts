/**
 * Stackra file contract:
 * Purpose: `ListHoldsOutput`, what `hold.list` answers: the tenant's matching holds, newest first.
 * Boundary: a schema; each hold is a `LegalHoldLine` shape. At most 500 holds (a shortcut, see the query).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { LegalHoldLine } from "#node/schemas/legal-hold-line.schema";

/** The listed holds. */
export class ListHoldsOutput extends Schema {
  /** The holds, newest first. */
  holds!: LegalHoldLine[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ListHoldsOutput,
    z.object({
      holds: z.array(
        z.object({
          id: z.string(),
          model: z.string(),
          recordId: z.string(),
          reason: z.string(),
          placedBy: z.string().nullable(),
          placedAt: z.string(),
          releasedAt: z.string().nullable(),
        }),
      ),
    }),
  ],
]);
