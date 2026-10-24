/**
 * Stackra file contract:
 * Purpose: `QueryRefOptions<I, O>`, the second argument of `queryRef`: the input and output, the route and the cache
 *          invalidation.
 * Boundary: a type only. `invalidateOn` at the top level is the short form of `cache.invalidateOn`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0305 (query `cache`); the HTTP conventions rule.
 */
import type { EndpointOptions } from "@stackra/actions";

import type { EventRef } from "#core/types/event-ref.type";
import type { QueryRefCache } from "#core/types/query-ref-cache.type";
import type { RefSchema } from "#core/types/ref-schema.type";

/** What a query ref declares. */
export interface QueryRefOptions<I extends RefSchema, O extends RefSchema> {
  /** The input schema or shape class. */
  readonly input: I;

  /** The output schema or shape class. */
  readonly output: O;

  /** The route; absent when the query has none (a widget-only query). */
  readonly http?: EndpointOptions;

  /** Short form of `cache.invalidateOn`. */
  readonly invalidateOn?: readonly EventRef[];

  /** The producer's cache declaration. */
  readonly cache?: QueryRefCache;
}
