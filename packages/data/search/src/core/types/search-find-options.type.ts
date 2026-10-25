/**
 * Stackra file contract:
 * Purpose: `SearchFindOptions<M>`, what `search.in(Model).find(phrase, options)` takes: exact filters on the facet's
 *          filter fields, how many rows, and the relations to load on them.
 * Boundary: a type only. A filter key is a path the model's `@Searchable` lists under `filters`; `SearchIndex` refuses
 *           any other with a `TypeError`. `undefined` members are allowed, so a query passes its input's optional
 *           fields through as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); cursor pagination in the HTTP conventions (limit 1 to 100, default 20).
 */
import type { SearchFilterValue } from "#contracts/index";

/** The options of a ranked read. */
export interface SearchFindOptions<M extends object> {
  /** Filter paths and the value each must hold, such as `{ status: ProductStatus.Active }`. */
  readonly filters?: Readonly<Record<string, SearchFilterValue>> | undefined;

  /** How many rows at most, 1 to 100; 20 when absent. */
  readonly limit?: number | undefined;

  /** Relations of `M` to load on the returned rows. */
  readonly populate?: readonly Extract<keyof M, string>[] | undefined;
}
