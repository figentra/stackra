/**
 * Stackra file contract:
 * Purpose: `IMPORT_CHANGE_SCHEMA`, the shipped `ImportChange$`: one record an import batch wrote (its import key and
 *          its before-image as JSON, or `null` when the batch created it).
 * Boundary: shape only; `before` stays opaque, as the target serialised it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0367 (decisions 7 and 8); STA-1284.
 */
import { z } from "zod";

import type { ImportChange } from "#contracts/types/import-change.type";

/** The shipped `ImportChange$`. */
export const IMPORT_CHANGE_SCHEMA: z.ZodType<ImportChange> = z.object({
  key: z.string().min(1),
  before: z.json().nullable(),
}) as unknown as z.ZodType<ImportChange>;
