/**
 * Stackra file contract:
 * Purpose: `LegalHoldLine`, one hold of `ListHoldsOutput` as a shape: the `LegalHold` contract as a Schema class, so
 *          gen reads the field as a shape (`shape_unknown_type` otherwise).
 * Boundary: a schema implementing `LegalHold`; times are ISO 8601 strings, ids are public ids. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0294 (decisions 4 and 13); data-layer gap gov20
 *                     (stackra-332).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { LegalHold } from "#contracts/types/legal-hold.type";

/**
 * One listed legal hold.
 *
 * @example
 * LegalHoldLine.create({ id: "lgh_01…", model: "Invoice", recordId: "inv_01…", reason: "Matter 2026-14", placedBy: null, placedAt, releasedAt: null });
 */
export class LegalHoldLine extends Schema implements LegalHold {
  /** The hold's public id. */
  id!: string;

  /** The entity name of the held record's model. */
  model!: string;

  /** The held record's id, or a subject's public id. */
  recordId!: string;

  /** Why it was placed. */
  reason!: string;

  /** The principal who placed it; null for a system call. */
  placedBy!: string | null;

  /** When it was placed. */
  placedAt!: string;

  /** When it was released; null while it holds. */
  releasedAt!: string | null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    LegalHoldLine,
    z.object({
      id: z.string(),
      model: z.string(),
      recordId: z.string(),
      reason: z.string(),
      placedBy: z.string().nullable(),
      placedAt: z.string(),
      releasedAt: z.string().nullable(),
    }),
  ],
]);
