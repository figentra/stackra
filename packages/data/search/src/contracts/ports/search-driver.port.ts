/**
 * Stackra file contract:
 * Purpose: the `SearchDriver` port: the engine behind `Search`. It ranks a model's rows for a phrase, counts the
 *          values of their filter fields (facets), stores each row's document and removes documents. Config `search.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `search.SearchDriver`. It deals in ids and documents only:
 *           `Search` builds documents from rows and loads rows for ids, so a driver never touches the ORM. Reads run in
 *           the caller's transaction and scope session, so row-level security decides what a search can see. An engine
 *           outside the database (`isolatesScopes` false) stores each document's scope and answers only the scope paths a
 *           request carries, so facet counts, pages and the existence of a match never cross scopes. A leaf
 *           file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1, 7 and 9: hybrid ranking, erasure, later engines behind one interface);
 *                     ADR 0089 (decision 6: every query scoped);
 *                     ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type); ADR 0404 (facets).
 */
import { Port } from "@stackra/contracts";

import type { SearchDocument } from "#contracts/types/search-document.type";
import type { SearchFacetRequest } from "#contracts/types/search-facet-request.type";
import type { SearchFacets } from "#contracts/types/search-facets.type";
import type { SearchRequest } from "#contracts/types/search-request.type";
import type { SearchTable } from "#contracts/types/search-table.type";

/**
 * A search engine.
 *
 * @example
 * export class OpenSearchSearchDriver extends Driver(SearchDriver) {
 *   async search(table: SearchTable, request: SearchRequest): Promise<readonly string[]> { ... }
 * }
 */
export abstract class SearchDriver extends Port {
  /** Type-only port key, so `DriverName<SearchDriver>` narrows to this port's drivers. */
  declare readonly "~key": "search.SearchDriver";

  /**
   * Whether the engine isolates scopes in the database (row-level security on the indexed table), so `SearchIndex`
   * passes no `scopePaths`; false for an engine that keeps its own copy of the documents.
   */
  readonly isolatesScopes: boolean = false;

  /** The ids of the rows of `table` that match `request`, best first, sliced by its offset and limit. */
  abstract search(table: SearchTable, request: SearchRequest): Promise<readonly string[]>;

  /** Per requested path, how many rows matching `request` hold each value, under its record visibility. */
  abstract facets(table: SearchTable, request: SearchFacetRequest): Promise<SearchFacets>;

  /** Stores each document as its row's current one, replacing what was stored. */
  abstract index(table: SearchTable, documents: readonly SearchDocument[]): Promise<void>;

  /** Removes the documents of `ids`, so no search finds those rows until they are indexed again. */
  abstract remove(table: SearchTable, ids: readonly string[]): Promise<void>;
}
