/**
 * Stackra file contract:
 * Purpose: the `SearchDriver` port: the engine behind `Search`. It ranks a model's rows for a phrase, counts the
 *          values of their filter fields (facets), stores each row's document, removes documents, and readies and
 *          swaps an index version for a zero-downtime rebuild. Config `search.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `search.SearchDriver`. It deals in ids and documents only:
 *           `Search` builds documents from rows and loads rows for ids, so a driver never touches the ORM. Reads run in
 *           the caller's transaction and scope session, so row-level security decides what a search can see. An engine
 *           outside the database (`isolatesScopes` false) stores each document's scope and answers only the scope paths a
 *           request carries, so facet counts, pages and the existence of a match never cross scopes. A leaf
 *           file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1, 7 and 9: hybrid ranking, erasure, later engines behind one interface);
 *                     ADR 0089 (decision 6: every query scoped);
 *                     ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type); ADR 0404 (facets);
 *                     stackra-301 (the vector lane); stackra-303 (versioned
 *                     index swap, ADR 0221 decision 7); stackra-302 (field kinds); stackra-326 (ranking rules,
 *                     did-you-mean neighbours).
 */
import { Port } from "@stackra/contracts";

import type { SearchDocument } from "#contracts/types/search-document.type";
import type { SearchFacetRequest } from "#contracts/types/search-facet-request.type";
import type { SearchFacets } from "#contracts/types/search-facets.type";
import type { SearchNeighbourRequest } from "#contracts/types/search-neighbour-request.type";
import type { SearchNeighbours } from "#contracts/types/search-neighbours.type";
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

  /**
   * Whether the engine ranks a request's `vector` as a third lane (and answers a request with no words from it alone);
   * false for an engine that does not, so `SearchIndex` reads it lexically and refuses `similar`.
   */
  readonly fusesVectors: boolean = false;

  /**
   * Whether the engine applies a request's `anyOf`, `ranges` and `sort`, and a document's `weights`; false for an
   * engine that does not, so `SearchIndex` refuses those reads rather than answer them wrongly.
   */
  readonly fieldKinds: boolean = false;

  /**
   * Whether the engine applies a request's ranking rules (`pinned`, `hidden`, `boosts`, `recency`); `SearchIndex` passes
   * none to an engine that does not, which then ranks by relevance alone.
   */
  readonly appliesRules: boolean = false;

  /** The ids of the rows of `table` that match `request`, best first, sliced by its offset and limit. */
  abstract search(table: SearchTable, request: SearchRequest): Promise<readonly string[]>;

  /** Per requested path, how many rows matching `request` hold each value, under its record visibility. */
  abstract facets(table: SearchTable, request: SearchFacetRequest): Promise<SearchFacets>;

  /** Stores each document as its row's current one, replacing what was stored. */
  abstract index(table: SearchTable, documents: readonly SearchDocument[]): Promise<void>;

  /** Removes the documents of `ids`, so no search finds those rows until they are indexed again. */
  abstract remove(table: SearchTable, ids: readonly string[]): Promise<void>;

  /**
   * The indexed words closest in spelling to each of `request.words` (did-you-mean), best first, at most
   * `request.limit` per word, over the rows `request.visible` lets the caller see; a word with none has no entry. The
   * default knows no vocabulary and answers none.
   */
  async neighbours(table: SearchTable, request: SearchNeighbourRequest): Promise<SearchNeighbours> {
    void table;
    void request;
    return {};
  }

  /**
   * Readies version `version` of `table`'s index for a rebuild: an empty shadow index (an engine), or the check that
   * its shadow columns exist (Postgres). From then on, a write without a version also reaches the shadow, so the
   * rebuild never misses a change; a write with `table.version` reaches the shadow alone. The default keeps no
   * versions.
   *
   * @throws TypeError when the engine keeps no versions, or the version cannot be readied.
   */
  async prepare(table: SearchTable, version: number): Promise<void> {
    throw new TypeError(
      `This search driver keeps no index versions, so ${table.table} cannot rebuild into version ${version}`,
    );
  }

  /**
   * Makes the rebuilt version `version` of `table` the live index at once (an alias swap, an index swap), so reads
   * move from the old documents to the new ones with no gap; Postgres swaps by its contract migration instead. The
   * default keeps no versions.
   *
   * @throws TypeError when the engine keeps no versions, or `version` was not readied.
   */
  async swap(table: SearchTable, version: number): Promise<void> {
    throw new TypeError(
      `This search driver keeps no index versions, so ${table.table} cannot swap to version ${version}`,
    );
  }
}
