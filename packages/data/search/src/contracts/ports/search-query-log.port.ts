/**
 * Stackra file contract:
 * Purpose: the `SearchQueryLog` port: where sampled search reads and result clicks are logged, and the popular phrases
 *          that complete a prefix (`SearchIndex.suggest`).
 * Boundary: an abstract class that is its own token, keyed `search.SearchQueryLog`. `record` must not hold up the read
 *           it logs: `SearchIndex` never awaits it, so a driver hands the entry on (the Postgres driver queues a job)
 *           and swallows nothing it can retry. `popular` reads only the session's scope and phrases that found rows. A
 *           leaf file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0221; ADR 0263 (ports resolve by type); ADR 0294 (decision 16); data-layer gaps se12 and se13
 *                     (stackra-326).
 */
import { Port } from "@stackra/contracts";

import type { SearchQueryEntry } from "#contracts/types/search-query-entry.type";

/**
 * A search query log.
 *
 * @example
 * export class ClickHouseSearchQueryLogDriver extends Driver(SearchQueryLog) { ... }
 */
export abstract class SearchQueryLog extends Port {
  /** Type-only port key, so `DriverName<SearchQueryLog>` narrows to this port's drivers. */
  declare readonly "~key": "search.SearchQueryLog";

  /** Logs one read or click. */
  abstract record(entry: SearchQueryEntry): Promise<void>;

  /** The most frequent logged phrases of `model` that start with `prefix` and found rows, most frequent first. */
  abstract popular(model: string, prefix: string, limit: number): Promise<readonly string[]>;
}
