/**
 * Stackra file contract:
 * Purpose: `SearchableOptions`, what `@Searchable` declares: the fields of the full-text document and the fields a
 *          search may filter on.
 * Boundary: a type only. Paths are model keys or keys of a populated relation (`variants.sku`), checked by gen; the
 *           Postgres search driver keeps the index in step with the unit of work.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (Postgres hybrid search); ADR 0294 (decision 6: `@Searchable` is a class facet).
 */

/** The search index of a model. */
export interface SearchableOptions {
  /** The fields whose text is searched, at least one. */
  readonly text: readonly string[];

  /** The fields a search may filter on. */
  readonly filters?: readonly string[];
}
