/**
 * Stackra file contract:
 * Purpose: `Search`, the reader a query injects to search a model's `@Searchable` index: `search.in(Product)` gives
 *          that model's `SearchIndex`, which ranks, pages, loads rows and keeps documents current, and
 *          `search.across([...])` fuses several models' results for a global search.
 * Boundary: a platform service with no state of its own: it holds the configured `SearchDriver` and the connected
 *           `Database`, and each `in(...)` call builds a fresh index value. Which driver runs is config `search.driver`;
 *           callers never name one. The class name is the injected platform name the template uses (as `GraphQuery`
 *           is @stackra/database's), so it carries no `Service` suffix.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 1 and 9: one interface over the engines); ADR 0294 (decisions 16 and 17:
 *                     dependencies by constructor type); ADR 0263.
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Database } from "@stackra/database";

import type { SearchDriver } from "#contracts/index";
import type { SearchHit } from "#core/types/search-hit.type";
import { SearchIndex } from "#core/values/search-index.value";

/** The reciprocal rank fusion constant, as the Postgres driver fuses its lanes. */
const FUSION = 60;

/**
 * Searches models.
 *
 * @example
 * constructor(search: Search) {
 *   super();
 *   this.search = search;
 * }
 *
 * const products = await this.search.in(Product).find(input.q, { filters: { status: ProductStatus.Active } });
 */
export class Search extends Service {
  /** The configured engine. */
  private readonly driver: SearchDriver;

  /** The connected database. */
  private readonly database: Database;

  /**
   * @param driver - the engine config `search.driver` picks.
   * @param database - the connected database whose running context each read and write joins.
   */
  constructor(driver: SearchDriver, database: Database) {
    super();
    this.driver = driver;
    this.database = database;
  }

  /**
   * The search index of `model`.
   *
   * @throws TypeError when the model has no `@Searchable` facet.
   */
  in<M extends object>(model: AnyClass<M>): SearchIndex<M> {
    return new SearchIndex(this.driver, this.database, model);
  }

  /**
   * The best rows for `phrase` across several models' indexes (a global search, the Cmd+K palette), fused by
   * reciprocal rank so each model's best rows come first, up to `limit` in all. Each index applies its own
   * visibility and filters nothing else. This is what "global indexes" means (ADR 0404): no shared cross-model index
   * table exists; each model keeps its own index in its own table and schema, and a global search reads them in turn.
   *
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @throws TypeError when a model has no `@Searchable` facet.
   */
  async across(
    models: readonly AnyClass[],
    phrase: string,
    options: { readonly limit?: number } = {},
  ): Promise<SearchHit[]> {
    const limit = options.limit ?? 20;
    const hits: (SearchHit & { readonly score: number })[] = [];
    // One index at a time: every read joins the caller's one entity manager.
    for (const model of models) {
      const rows = await this.in(model).find(phrase, { limit });
      rows.forEach((row, rank) => hits.push({ model, row, score: 1 / (FUSION + rank + 1) }));
    }
    return hits
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ model, row }) => ({ model, row }));
  }
}
