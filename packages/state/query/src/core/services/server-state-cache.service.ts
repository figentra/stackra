/**
 * Stackra file contract:
 * Purpose: `ServerStateCache`, a client's server-state cache: the TanStack Query client the generated query hooks read
 *          through, configured from `QueryConfig` (fresh time, retries, refetch on focus), persisted per partition in
 *          the `cache` area and restored after a restart while younger than `persistMaxAgeHours`, and refetched live:
 *          a watched query is invalidated whenever an event of its `cache.invalidateOn` is broadcast.
 * Boundary: a singleton service; the host's query context calls `open(partition, buster)` after sign-in and on every
 *           switch, which empties the cache first, so another principal's or scope's results never show. The cache is
 *           written only through a persister that encrypts while `persistEncrypted` is on (ADR 0059 decision 1).
 *           What is restored is each result's JSON form. Live refetch subscribes through `@stackra/realtime`'s
 *           connection and reimplements no transport; the refresh is data-free, so the refetch runs through the
 *           caller's own authorised query (ADR 0225). Query keys start with the query's versioned key.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 1 and 3); ADR 0059 (decision 1); ADR 0225; R-25 (live queries); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { RealtimeConnection } from "@stackra/realtime";
import type { RealtimeEventRef } from "@stackra/realtime";
import { StorageArea } from "@stackra/storage";
import { dehydrate, hydrate, QueryClient } from "@tanstack/query-core";

import { QueryConfig } from "#config/query.config";
import { QueryPersister } from "#contracts/ports/query-persister.port";
import { PERSISTED_CACHE_SCHEMA } from "#core/constants/persisted-cache-schema.constant";
import { partitionKey } from "#core/functions/partition-key.function";
import type { LiveQueryRef } from "#core/types/live-query-ref.type";
import type { QueryPartition } from "#core/types/query-partition.type";

/** How long the cache waits after a change before it persists, so a burst of results is written once. */
const PERSIST_DELAY_MS = 1000;

/** The realtime subscriptions of one watched query, shared by every watcher of it. */
interface Watch {
  count: number;
  readonly stop: () => void;
}

/**
 * The client's server-state cache.
 *
 * @example
 * await cache.open({ principal: session.user.userId, scope: activeScope }, manifestHash);
 * const stop = cache.watch(OrderKpisQuery); // refetches on every OrderPaid
 * cache.client.fetchQuery({ queryKey: [OrderKpisQuery.key, input], queryFn });
 */
export class ServerStateCache extends Service {
  /** The TanStack Query client; every key of a query starts with its versioned key (`[OrderKpisQuery.key, input]`). */
  readonly client: QueryClient;

  private readonly config: QueryConfig;

  private readonly persister: QueryPersister;

  private readonly realtime: RealtimeConnection;

  private readonly clock: Clock;

  /** How long a persisted result may be restored, in milliseconds; 0 when the cache is not persisted. */
  private readonly maxAge: number;

  private readonly watches = new Map<string, Watch>();

  private partition: string | undefined;

  private stopPersisting: () => void = () => undefined;

  /**
   * @param config - fresh time, retries, focus refetch, scope and persistence.
   * @param persister - keeps the cache in the `cache` area.
   * @param realtime - the client's realtime connection, for live queries.
   * @param clock - stamps and ages the persisted cache.
   */
  constructor(
    config: QueryConfig,
    persister: QueryPersister,
    realtime: RealtimeConnection,
    clock: Clock,
  ) {
    super();
    this.config = config;
    this.persister = persister;
    this.realtime = realtime;
    this.clock = clock;
    const isPersisted = !config.persistEncrypted || persister.isEncrypted;
    this.maxAge = isPersisted
      ? Duration.toMilliseconds(Duration.hours(config.persistMaxAgeHours))
      : 0;
    this.client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Duration.toMilliseconds(Duration.seconds(config.staleTimeSeconds)),
          retry: config.retry,
          refetchOnWindowFocus: config.refetchOnFocus,
          // A restored result must outlive its age limit in memory, or it is collected before it is read.
          ...(this.maxAge > 0 ? { gcTime: this.maxAge } : {}),
        },
      },
    });
  }

  /**
   * Opens the cache of `partition`: empties the client, restores what was persisted under the same `buster` within
   * `persistMaxAgeHours`, and persists every later change.
   *
   * @param buster - the host's client manifest hash; a stored cache under another buster is dropped.
   * @throws Error the persister's read error; the cache then runs in memory only for this partition.
   */
  async open(partition: QueryPartition, buster: string): Promise<void> {
    this.stopPersisting();
    this.stopPersisting = () => undefined;
    this.client.clear();
    const key = `query.cache.${partitionKey(this.config.scope, partition)}`;
    this.partition = key;
    if (this.maxAge === 0) return;
    const stored = PERSISTED_CACHE_SCHEMA.safeParse(
      await this.persister.read(StorageArea.Cache, key),
    );
    if (this.partition !== key) return;
    const age = stored.success ? this.clock.now().getTime() - Date.parse(stored.data.savedAt) : NaN;
    if (stored.success && stored.data.buster === buster && age < this.maxAge)
      hydrate(this.client, stored.data.state);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = (): void => {
      const snapshot = {
        buster,
        savedAt: this.clock.now().toISOString(),
        state: dehydrate(this.client),
      };
      // A failed save keeps the cache in memory; the next change writes again.
      this.persister.write(StorageArea.Cache, key, snapshot).catch(() => undefined);
    };
    const unsubscribe = this.client.getQueryCache().subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(save, PERSIST_DELAY_MS);
    });
    this.stopPersisting = () => {
      clearTimeout(timer);
      unsubscribe();
    };
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

  /** Stops persisting and every live subscription when the container closes. */
  onApplicationShutdown(): void {
    this.stopPersisting();
    for (const watch of this.watches.values()) watch.stop();
    this.watches.clear();
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
