/**
 * Stackra file contract:
 * Purpose: `ServerStateCache`, a client's server-state cache: the TanStack Query client the generated query hooks read
 *          through, configured from `QueryConfig` (fresh time, retries, refetch on focus), emptied on every partition
 *          switch and wipe, and refetched live: a watched query is invalidated whenever an event of its
 *          `cache.invalidateOn` is broadcast.
 * Boundary: a singleton service; the host's query context calls `open(partition)` after sign-in and on every switch,
 *           which empties the cache, so another principal's or scope's results never show. The cache lives in memory
 *           only: a query that is not declared a replica is not available offline (ADR 0338 decision 3), so what a
 *           device keeps across a restart is the replicas `ReplicaStore` holds. Live refetch subscribes through
 *           `@stackra/realtime`'s connection and reimplements no transport; the refresh is data-free, so the refetch
 *           runs through the caller's own authorised query (ADR 0225). Query keys start with the query's versioned key.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 1 and 3); ADR 0338 (decisions 3 and 4); ADR 0225; R-25 (live queries); ADR
 *                     0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { RealtimeConnection } from "@stackra/realtime";
import type { RealtimeEventRef } from "@stackra/realtime";
import { QueryClient } from "@tanstack/query-core";

import type { QueryConfig } from "#config/query.config";
import type { OfflineLock } from "#core/services/offline-lock.service";
import type { LiveQueryRef } from "#core/types/live-query-ref.type";
import type { QueryPartition } from "#core/types/query-partition.type";

/** The realtime subscriptions of one watched query, shared by every watcher of it. */
interface Watch {
  count: number;
  readonly stop: () => void;
}

/**
 * The client's server-state cache.
 *
 * @example
 * cache.open({ principal: session.user.userId, scope: activeScope });
 * const stop = cache.watch(OrderKpisQuery); // refetches on every OrderPaid
 * cache.client.fetchQuery({ queryKey: [OrderKpisQuery.key, input], queryFn });
 */
export class ServerStateCache extends Service {
  /** The TanStack Query client; every key of a query starts with its versioned key (`[OrderKpisQuery.key, input]`). */
  readonly client: QueryClient;

  private readonly realtime: RealtimeConnection;

  private readonly watches = new Map<string, Watch>();

  private readonly stopWiping: () => void;

  /**
   * @param config - fresh time, retries and focus refetch.
   * @param realtime - the client's realtime connection, for live queries.
   * @param lock - empties the cache when the device's offline data is wiped.
   */
  constructor(config: QueryConfig, realtime: RealtimeConnection, lock: OfflineLock) {
    super();
    this.realtime = realtime;
    this.client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Duration.toMilliseconds(Duration.seconds(config.staleTimeSeconds)),
          retry: config.retry,
          refetchOnWindowFocus: config.refetchOnFocus,
        },
      },
    });
    this.stopWiping = lock.onWipe(() => this.client.clear());
  }

  /** Ends every live subscription and stops listening to the lock when the container closes. */
  onApplicationShutdown(): void {
    this.stopWiping();
    for (const watch of this.watches.values()) watch.stop();
    this.watches.clear();
  }

  /** Opens the cache of `partition`: empties the client, so nothing of the previous partition shows. */
  open(_partition: QueryPartition): void {
    this.client.clear();
  }

  /**
   * Keeps the results of `query` live: each broadcast of an event its `invalidateOn` names invalidates every cached
   * result of the query, which refetches the ones on screen. Watchers of one query share its subscriptions.
   *
   * @returns stops this watcher; the subscriptions end with the last one.
   */
  watch(query: LiveQueryRef): () => void {
    const events = query.invalidateOn ?? [];
    if (events.length === 0) return () => undefined;
    const watch = this.watches.get(query.key) ?? this.listen(query.key, events);
    watch.count += 1;
    let isStopped = false;
    return () => {
      if (isStopped) return;
      isStopped = true;
      watch.count -= 1;
      if (watch.count > 0) return;
      watch.stop();
      this.watches.delete(query.key);
    };
  }

  /** Subscribes `key`'s invalidation to each of `events` and records the watch. */
  private listen(key: string, events: readonly RealtimeEventRef[]): Watch {
    const invalidate = (): void => {
      void this.client.invalidateQueries({ queryKey: [key] });
    };
    const stops = events.map((event) => this.realtime.subscribe(event, invalidate));
    const watch: Watch = {
      count: 0,
      stop: () => {
        for (const stop of stops) stop();
      },
    };
    this.watches.set(key, watch);
    return watch;
  }
}
