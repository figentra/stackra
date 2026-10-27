/**
 * Stackra file contract:
 * Purpose: `SearchAcrossOptions`, what `search.across(models, phrase, options)` takes: how many hits in all, each
 *          model's exact filters, the phrase's locale and the Arabizi switch.
 * Boundary: a type only. Filters are per model, keyed by the model class, because each model's `@Searchable` lists its
 *           own filter paths; a model with no entry is read unfiltered, and `SearchIndex` refuses a path its model does
 *           not list with a `TypeError`. `locale` and `arabizi` apply to every model, as `SearchFindOptions` reads them.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); ADR 0404 (global search reads each model's own index); STA-1251.
 */
import type { AnyClass } from "@stackra/container";

import type { SearchFilterValue } from "#contracts/index";

/** The options of a search across several models. */
export interface SearchAcrossOptions {
  /** How many hits at most, in all, 1 to 100; 20 when absent. */
  readonly limit?: number | undefined;

  /**
   * Each model's filter paths and the value each must hold.
   *
   * @example new Map([[Product, { status: ProductStatus.Active }]])
   */
  readonly filters?: ReadonlyMap<AnyClass, Readonly<Record<string, SearchFilterValue>>> | undefined;

  /** The phrase's locale (`ar-SA`): only that language's synonym sets apply; every language's when absent. */
  readonly locale?: string | undefined;

  /** Whether an Arabizi word also matches its Arabic spelling; on when absent. */
  readonly arabizi?: boolean | undefined;
}
