/**
 * Stackra file contract:
 * Purpose: `ResourceSearch`, the part of a model's generated search query (`Search<Model>Query`, `@stackra/search`) a
 *          list read uses: its `handle`, answering a phrase with the hits' primary keys.
 * Boundary: a type only, so `@stackra/panel` takes no dependency on `@stackra/search`: gen injects the member's own search
 *           query into the list read of a searchable model.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 6: the generated search query); ADR 0307 (rule 2: search exists only when the
 *                     model is `@Searchable`); STA-1971.
 */
import type { QueryContext } from "@stackra/actions";

/** A model's search query, as a list read calls it. */
export interface ResourceSearch {
  /** The best hits of `input.q`, each with the record's primary key. */
  handle(
    input: { readonly q: string; readonly limit?: number },
    ctx: QueryContext,
  ): Promise<{ readonly hits: readonly { readonly id: string }[] }>;
}
