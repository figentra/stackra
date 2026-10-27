/**
 * Stackra file contract:
 * Purpose: `SearchFacetOptions`, what `search.in(Model).facets(phrase, options)` takes: the filter paths to count, the
 *          exact filters already applied, how many values per path, and the locale whose synonym sets apply.
 * Boundary: a type only. Every path and filter key is one the model's `@Searchable` lists under `filters`;
 *           `SearchIndex` refuses any other with a `TypeError`. `undefined` members are allowed, so a query passes its
 *           input's optional fields through as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); ADR 0333 (amendment); ADR 0404 (facets under the VisibilityFilter).
 */
import type { SearchFilterValue } from "#contracts/index";

/** The options of a facet count. */
export interface SearchFacetOptions {
  /** The filter paths whose values are counted, such as `["status", "collections.slug"]`. */
  readonly paths: readonly string[];

  /** Filter paths and the value each must hold, as a ranked read takes them. */
  readonly filters?: Readonly<Record<string, SearchFilterValue>> | undefined;

  /** The phrase's locale (`ar-SA`): only that language's synonym sets apply; every language's when absent. */
  readonly locale?: string | undefined;

  /** How many values per path at most, the most frequent first, 1 to 100; 20 when absent. */
  readonly limit?: number | undefined;
}
