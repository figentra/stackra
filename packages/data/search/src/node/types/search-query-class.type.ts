/**
 * Stackra file contract:
 * Purpose: `SearchQueryClass`, what `SearchQuery(Model)` returns: the base class of one model's search query, built with
 *          the `Search` service and the connected `Database`, whose `handle` answers a `SearchQueryInput` with a
 *          `SearchQueryOutput`.
 * Boundary: a type only. It names the class's public side so the declaration output never has to spell the class
 *           expression the factory builds.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29); ADR 0294 (decisions 16 and 25).
 */
import type { Query, QueryContext } from "@stackra/actions";
import type { Database } from "@stackra/database";

import type { Search } from "#core/services/search.service";
import type { SearchQueryInput } from "#node/schemas/search-query-input.schema";
import type { SearchQueryOutput } from "#node/schemas/search-query-output.schema";

/** The base class of one model's search query. */
export type SearchQueryClass = abstract new (
  search: Search,
  database: Database,
) => Query & {
  /** The hits of `input.q` in the model's index, as the caller may see them. */
  handle: (input: SearchQueryInput, ctx: QueryContext) => Promise<SearchQueryOutput>;
};
