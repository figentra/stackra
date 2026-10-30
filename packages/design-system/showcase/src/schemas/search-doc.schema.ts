/**
 * Stackra file contract:
 * Purpose: `SearchDocSchema`, the runtime shape check of one generated `search/index.json` row.
 * Boundary: a zod schema only; the TypeScript type lives in `types/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5; ADR 0095 (zod at the edges).
 */
import { z } from "zod";

import { ComponentCategory } from "#src/enums/component-category.enum";
import { ComponentTier } from "#src/enums/component-tier.enum";
import { Platform } from "#src/enums/platform.enum";

/** The shape of one search row. */
export const SearchDocSchema = z.strictObject({
  key: z.string().regex(/^(free|pro)\/[a-z0-9-]+$/),
  tier: z.enum(ComponentTier),
  category: z.enum(ComponentCategory),
  platforms: z.array(z.enum(Platform)),
  lang: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  headings: z.array(z.string()),
  propNames: z.array(z.string()),
});
