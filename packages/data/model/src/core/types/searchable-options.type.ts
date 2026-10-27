/**
 * Stackra file contract:
 * Purpose: `SearchableOptions`, what `@Searchable` declares: the fields of the full-text document, the fields a
 *          search may filter on, and whether the text fields are also embedded for semantic search.
 * Boundary: a type only. Paths are model keys or keys of a populated relation (`variants.sku`), checked by gen; the
 *           Postgres search driver keeps the index in step with the unit of work.
 * Runtime: isomorphic
 *           `semantic: true` sends the text fields to the in-region `Embedder` (@stackra/search), so none of them may
 *           carry a data class whose `ai` is `never`: gen refuses it (`searchable_semantic_ai_never`) and search refuses
 *           it again at index time.
 * Governing contract: ADR 0221 (Postgres hybrid search); ADR 0294 (decision 6: `@Searchable` is a class facet);
 *                     ADR 0380 (the `ai: never` floor); STA-1326.
 */

/** The search index of a model. */
export interface SearchableOptions {
  /** The fields whose text is searched, at least one. */
  readonly text: readonly string[];

  /** The fields a search may filter on. */
  readonly filters?: readonly string[];

  /** Whether the text fields are also embedded into the vector index for semantic search; off when absent. */
  readonly semantic?: boolean;
}
