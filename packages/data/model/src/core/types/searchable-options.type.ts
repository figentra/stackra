/**
 * Stackra file contract:
 * Purpose: `SearchableOptions`, what `@Searchable` declares: the fields of the full-text document, the fields a
 *          search may filter on, sort by or bound by a range, the weight of a text field, the presence condition of a
 *          row, and whether the text fields are also embedded for semantic search.
 * Boundary: a type only. Paths are model keys or keys of a populated relation (`variants.sku`), checked by gen; the
 *           Postgres search driver keeps the index in step with the unit of work. A sortable or range field holds a
 *           number, or a date stored as its ISO 8601 string; a sort reads a row's first value of the path. `boost`
 *           names text fields only. `when` is declarative data, never a function, so gen and the change consumers can
 *           read which fields decide presence.
 * Runtime: isomorphic
 *           `semantic: true` sends the text fields to the in-region `Embedder` (@stackra/search), so none of them may
 *           carry a data class whose `ai` is `never`: gen refuses it (`searchable_semantic_ai_never`) and search refuses
 *           it again at index time.
 * Governing contract: ADR 0221 (Postgres hybrid search); ADR 0294 (decision 6: `@Searchable` is a class facet);
 *                     ADR 0380 (the `ai: never` floor); STA-1326; data-layer gap se9 (stackra-302: facet field kinds).
 */

import type { SearchWeight } from "#core/types/search-weight.type";
import type { SearchWhenValue } from "#core/types/search-when-value.type";

/** The search index of a model. */
export interface SearchableOptions {
  /** The fields whose text is searched, at least one; a field's position is its weight unless `boost` names it. */
  readonly text: readonly string[];

  /** The fields a search may filter on, by one value or any of several. */
  readonly filters?: readonly string[];

  /** The fields a search may sort by (a number, or a date as its ISO string), such as `price` or `publishedAt`. */
  readonly sortable?: readonly string[];

  /** The fields a search may bound by a range (a number, or a date as its ISO string). */
  readonly ranges?: readonly string[];

  /** The weight of a text field by its path, overriding its position (the first `A`, the fourth and later `D`). */
  readonly boost?: Readonly<Record<string, SearchWeight>>;

  /**
   * When a row is searchable, by field: each field must hold one of its listed values, else the row has no document
   * (Scout's `shouldBeSearchable`), such as `{ status: ["active"] }`. Every row is searchable when absent.
   */
  readonly when?: Readonly<Record<string, readonly SearchWhenValue[]>>;

  /** Whether the text fields are also embedded into the vector index for semantic search; off when absent. */
  readonly semantic?: boolean;
}
