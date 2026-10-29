/**
 * Stackra file contract:
 * Purpose: `SEARCH_QUERY_OUTPUT_SCHEMA`, the zod schema of `SearchQueryOutput`: hits of a key, a title and an optional
 *          snippet.
 * Boundary: the stand-in for what gen will write for this package (STA-339). Internal: the output's file registers it
 *           and its `hits` field takes its validator from it; not exported from the entry. In its own file because a
 *           `@Field(zod)` hatch may reference only imports.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6); ADR 0294 (decision 26: a package ships its own `X$`).
 */
import { z } from "zod";

/** The rules of the output. */
export const SEARCH_QUERY_OUTPUT_SCHEMA = z.object({
  hits: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      snippet: z.string().optional(),
    }),
  ),
});
