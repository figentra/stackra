/**
 * Stackra file contract:
 * Purpose: `SearchFindOptions<M>`, what `search.in(Model).find(phrase, options)` takes: exact filters on the facet's
 *          filter fields, how many rows, the relations to load on them, the locale whose synonym sets apply, the
 *          per-query Arabizi switch and the embedder of a hybrid read.
 * Boundary: a type only. A filter key is a path the model's `@Searchable` lists under `filters`, a range key one it
 *           lists under `ranges` and a sort path one it lists under `sortable`; `SearchIndex` refuses any other with a
 *           `TypeError`. `undefined` members are allowed, so a query passes its input's optional
 *           fields through as they are.
 *           The Arabizi switch only adds or drops an alternative spelling, so turning it off narrows a search (a code
 *           field, an English-only list) and never widens what record visibility allows.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); cursor pagination in the HTTP conventions (limit 1 to 100, default 20);
 *                     OS-173 (Arabizi expansion); STA-1251 (the per-query switch);
 *                     stackra-301 (the hybrid read); stackra-302 (any-of filters, ranges and sort).
 */
import type { Embedder, SearchFilterValue, SearchRange, SearchSort } from "#contracts/index";

/** The options of a ranked read. */
export interface SearchFindOptions<M extends object> {
  /**
   * Filter paths and the value each must hold, such as `{ status: ProductStatus.Active }`, or the values one of which
   * it must hold (`{ color: ["red", "blue"] }`, an OR within the facet).
   */
  readonly filters?:
    | Readonly<Record<string, SearchFilterValue | readonly SearchFilterValue[]>>
    | undefined;

  /** Range paths (the facet's `ranges`) and their bounds, such as `{ price: { gte: 100, lt: 500 } }`. */
  readonly ranges?: Readonly<Record<string, SearchRange>> | undefined;

  /**
   * The sortable paths (the facet's `sortable`) the rows are ordered by before relevance, at most three, such as
   * `{ path: "price", direction: "desc" }`; relevance alone when absent.
   */
  readonly sort?: SearchSort | readonly SearchSort[] | undefined;

  /** How many rows at most, 1 to 100; 20 when absent. */
  readonly limit?: number | undefined;

  /** The phrase's locale (`ar-SA`): only that language's synonym sets apply; every language's when absent. */
  readonly locale?: string | undefined;

  /** Whether an Arabizi word (`7abibi`) also matches its Arabic spelling; on when absent. */
  readonly arabizi?: boolean | undefined;

  /**
   * The embedder of the index's passages, for a hybrid read: on a `@Searchable({ semantic: true })` model and a driver
   * that fuses vectors, the phrase is embedded and its nearest passages rank rows as a third lane. Lexical when absent.
   */
  readonly embedder?: Embedder | undefined;

  /** Relations of `M` to load on the returned rows. */
  readonly populate?: readonly Extract<keyof M, string>[] | undefined;
}
