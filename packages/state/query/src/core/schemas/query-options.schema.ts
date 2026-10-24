/**
 * Stackra file contract:
 * Purpose: `QueryOptions`, the shape of `QueryConfig`: what the cache and the queue are keyed by, how the cache is
 *          persisted, how the offline queue replays, and the read defaults of every query.
 * Boundary: a shape class; it registers this package's own schema (`QUERY_CONFIG_SCHEMA`) for itself when the module
 *           loads. The defaults are the safe ones: keyed by principal and active scope, the cache persisted only
 *           encrypted, replay on reconnect led by one context, a week of retention. Which actions may queue is not a
 *           value here: it is the generated offline map.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decisions 1 and 2); ADR 0252 (decision 2); ADR 0294 (decisions 4, 19 and 26).
 */
import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { QueueLeader } from "#contracts/ports/queue-leader.port";
import { QUERY_CONFIG_SCHEMA } from "#core/constants/query-config-schema.constant";
import { QueryScope } from "#core/enums/query-scope.enum";

/**
 * The server-state settings of a client.
 *
 * @example
 * export class QueryConfig extends BaseQueryConfig {
 *   override scope: QueryScope = QueryScope.ActiveScope;
 *   override queueLeader: DriverName<QueueLeader> = "broadcast_channel";
 * }
 */
export class QueryOptions extends Schema {
  /** What the cache and the queue are keyed by; the principal is always part of the key. */
  scope: QueryScope = QueryScope.ActiveScope;

  /** Persist the cache only through a persister that encrypts at rest; off allows a plain one. */
  persistEncrypted = true;

  /** Hours a persisted query may be shown after a restart before it must refetch; 0 keeps nothing. */
  persistMaxAgeHours = 24;

  /** Drain the queue as soon as the network returns (or this context starts leading), without a click. */
  replayOnReconnect = true;

  /** The `QueueLeader` driver that elects the one context that drains the queue. */
  queueLeader: DriverName<QueueLeader> = "memory";

  /** Aggregates replayed in parallel; each aggregate stays FIFO. */
  maxParallelAggregates = 4;

  /** Days a queued call is kept at most; an older one surfaces as a conflict, never silently dropped. */
  queueRetentionDays = 7;

  /** Seconds a fetched query counts as fresh. */
  staleTimeSeconds = 0;

  /** Refetch stale queries when the window or the app regains focus. */
  refetchOnFocus = true;

  /** Retries of a failed read before the error state shows. */
  retry = 3;
}

registerSchemas([[QueryOptions, QUERY_CONFIG_SCHEMA]]);
