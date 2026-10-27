/**
 * Stackra file contract:
 * Purpose: `CATALOGUE_ITEM_SCHEMA`, the check a client runs on a catalogue item the registry answers before trusting
 *          it.
 * Boundary: shape only.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 12); ADR 0294 (decision 26).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { STACKRA_MANIFEST_SCHEMA } from "#contracts/constants/stackra-manifest-schema.constant";
import { StackraKind } from "#contracts/enums/stackra-kind.enum";
import type { CatalogueItem } from "#contracts/types/catalogue-item.type";

const nullableText = z.string().nullable();

/** Validates one `CatalogueItem` as the registry catalogue returns it. */
export const CATALOGUE_ITEM_SCHEMA: z.ZodType<CatalogueItem> = z.object({
  name: z.string().min(1),
  scope: z.string().startsWith("@"),
  kind: z.enum(Enum.values(StackraKind) as [StackraKind, ...StackraKind[]]),
  description: nullableText,
  latest: z.string().min(1),
  distTags: z.record(z.string(), z.string()),
  access: z.enum(["open", "licensed"]),
  licence: nullableText,
  keywords: z.array(z.string()),
  repository: nullableText,
  homepage: nullableText,
  publishedAt: z.string(),
  deprecated: nullableText,
  stackra: STACKRA_MANIFEST_SCHEMA,
  versions: z.array(z.string()).optional(),
});
