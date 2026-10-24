/**
 * Stackra file contract:
 * Purpose: `QueryOptions`, what `Query({...})` takes: the written key, the actors, the permission when the stem
 *          differs, the API area, interceptors, and the surfaces (`endpoint`, `tool`, `intent`) and the `cache` profile.
 * Boundary: a type only. A query changes no state, so it takes no preconditions, idempotency, job or offline option;
 *           `tool` is on by default (queries are MCP tools under the caller's permissions).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 21); ADR 0305 (rules 28 and 31); ADR 0155 (queries are MCP tools).
 */
import type { AnyClass } from "@stackra/container";
import type { ActorKind, ApiArea } from "@stackra/contracts";

import type { Interceptor } from "#core/bases/interceptor.base";
import type { EndpointOptions } from "#core/types/endpoint-options.type";
import type { QueryCache } from "#core/types/query-cache.type";

/** The options of a query. */
export interface QueryOptions {
  /** `<model>.<name>` in snake_case (`order.list`, `points.stats_today`), written once. */
  readonly key: string;

  /** The actor kinds that may call it; any other is refused (`forbidden`). */
  readonly actors: readonly ActorKind[];

  /** A `Permissions` static (`ProductPermissions.read`) when the permission's class stem differs from the model. */
  readonly permission?: unknown;

  /** The major version, a whole number from 1; `1` when absent. */
  readonly version?: number;

  /** The API area its endpoint and rate-limit bucket belong to; `ApiArea.App` when absent. */
  readonly area?: ApiArea;

  /** Wrappers around the whole call, the first outermost. */
  readonly interceptors?: readonly AnyClass<Interceptor>[];

  /** A `GET` route override, or `false` for no endpoint; derived from the key when absent. */
  readonly endpoint?: EndpointOptions | false;

  /** Expose it as an MCP tool; on when absent. */
  readonly tool?: boolean;

  /** Let the intent router and the palette start it, with phrases from the lang files. */
  readonly intent?: boolean;

  /** Serve results from cache for a time, invalidated by events. */
  readonly cache?: QueryCache;
}
