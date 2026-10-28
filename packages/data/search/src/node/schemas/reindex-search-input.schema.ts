/**
 * Stackra file contract:
 * Purpose: `ReindexSearchInput`, the input of the search reindex jobs: the model to reindex (every registered one when
 *          absent) and, for a partial reindex, the instant from which updated rows are indexed again.
 * Boundary: a shape class in its own file; `stackra search:reindex` fills it from its flags. It registers its schema
 *           when the module loads (STA-339 replaces the registration). The scope is the job's, never input.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0404 (decision 3).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * Which rows a reindex visits.
 *
 * @example
 * ReindexSearchInput.create({ model: "Product", since: "2026-10-27T00:00:00.000Z" });
 */
export class ReindexSearchInput extends Schema {
  /** A registered model's class name; every registered model when absent. */
  @Str({
    min: 1,
    max: 200,
  })
  model?: string;

  /** An ISO 8601 instant: only rows updated at or after it are indexed again (a partial reindex). */
  @Str({
    min: 1,
    max: 40,
  })
  since?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ReindexSearchInput,
    z.object({
      model: z.string().min(1).max(200).optional(),
      since: z.iso.datetime().optional(),
    }),
  ],
]);
