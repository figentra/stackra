/**
 * Stackra file contract:
 * Purpose: `Search`, the reader a query injects to search a model's `@Searchable` index: `search.in(Product)` gives
 *          that model's `SearchIndex`, which ranks, pages, loads rows and keeps documents current.
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
import { SearchIndex } from "#core/values/search-index.value";

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
}
