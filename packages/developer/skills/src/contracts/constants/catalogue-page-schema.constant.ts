/**
 * Stackra file contract:
 * Purpose: `CATALOGUE_PAGE_SCHEMA`, the check a client runs on one catalogue page before trusting it.
 * Boundary: shape only.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 12); ADR 0294 (decision 26).
 */
import { z } from "zod";

import { CATALOGUE_ITEM_SCHEMA } from "#contracts/constants/catalogue-item-schema.constant";
import type { CataloguePage } from "#contracts/types/catalogue-page.type";

/** One `CataloguePage`. */
export const CATALOGUE_PAGE_SCHEMA: z.ZodType<CataloguePage> = z.object({
  items: z.array(CATALOGUE_ITEM_SCHEMA),
  next: z.string().nullable(),
});
