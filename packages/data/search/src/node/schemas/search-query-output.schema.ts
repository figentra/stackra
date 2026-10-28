/**
 * Stackra file contract:
 * Purpose: `SearchQueryOutput`, what a model's generated search query (`<model>.search`) answers: its hits, best first.
 * Boundary: a shape class in its own file; each hit carries only its key, title and snippet (`SearchQueryHit`). It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29); ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one
 *                     declaration per file).
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { SearchQueryHit } from "#node/types/search-query-hit.type";

/** The rules of the output: hits of a key, a title and an optional snippet. */
const SEARCH_QUERY_OUTPUT_SCHEMA = z.object({
  hits: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      snippet: z.string().optional(),
    }),
  ),
});

/**
 * The hits of one search.
 *
 * @example
 * return SearchQueryOutput.create({ hits: [{ id: "prd_1", title: "Linen shirt", snippet: "…linen shirt comes…" }] });
 */
export class SearchQueryOutput extends Schema {
  /** The hits, best first, at most the input's `limit`. */
  @Field(SEARCH_QUERY_OUTPUT_SCHEMA.shape.hits)
  hits!: SearchQueryHit[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[SearchQueryOutput, SEARCH_QUERY_OUTPUT_SCHEMA]]);
