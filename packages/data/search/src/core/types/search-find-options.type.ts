/**
 * Stackra file contract:
 * Purpose: `SearchFindOptions<M>`, what `search.in(Model).find(phrase, options)` takes: exact filters on the facet's
 *          filter fields, how many rows, the relations to load on them, the locale whose synonym sets apply, and the
 *          per-query Arabizi switch.
 * Boundary: a type only. A filter key is a path the model's `@Searchable` lists under `filters`; `SearchIndex` refuses
 *           any other with a `TypeError`. `undefined` members are allowed, so a query passes its input's optional
 *           fields through as they are.
 *           The Arabizi switch only adds or drops an alternative spelling, so turning it off narrows a search (a code
 *           field, an English-only list) and never widens what record visibility allows.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); cursor pagination in the HTTP conventions (limit 1 to 100, default 20);
 *                     OS-173 (Arabizi expansion); STA-1251 (the per-query switch).
 */
import type { SearchFilterValue } from "#contracts/index";

/** The options of a ranked read. */
export interface SearchFindOptions<M extends object> {
  /** Filter paths and the value each must hold, such as `{ status: ProductStatus.Active }`. */
  readonly filters?: Readonly<Record<string, SearchFilterValue>> | undefined;

  /** How many rows at most, 1 to 100; 20 when absent. */
  readonly limit?: number | undefined;

  /** The phrase's locale (`ar-SA`): only that language's synonym sets apply; every language's when absent. */
  readonly locale?: string | undefined;

  /** Whether an Arabizi word (`7abibi`) also matches its Arabic spelling; on when absent. */
  readonly arabizi?: boolean | undefined;

  /** Relations of `M` to load on the returned rows. */
  readonly populate?: readonly Extract<keyof M, string>[] | undefined;
}
