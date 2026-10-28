/**
 * Stackra file contract:
 * Purpose: `ReplicaStore`, the bounded replicas of a client (ADR 0338 decision 3): for every query declared a replica it
 *          downloads the replica once, then asks only for the changes since the opaque cursor the server returned, on
 *          `open`, on every reconnect and on each broadcast of the query's refresh signal (`invalidateOn`); it keeps
 *          each replica bounded by age (`window`, by each record's `at`) and size (`limit`, the newest win), limited to
 *          the device's slice of its `scope` dimension, persisted in the sealed `cache` area, and carries the "as of"
 *          time every reading screen shows (`useReplica`).
 * Boundary: a singleton service; the host's query context calls `open(partition, slice)` after sign-in and on every
 *           switch, so a replica is only read and refreshed for the principal and scope that filled it. A replica
 *           whose scope dimension the slice lacks is not kept, and a record whose scope field is not the slice's is
 *           dropped even when the server sends it. Replicas persist only through an encrypting persister while
 *           `persistEncrypted` is on, and a stored replica older than `persistMaxAgeHours` refills. A failed refresh
 *           keeps what the replica holds and its "as of" time. An `OfflineLock` wipe closes the store until the next
 *           `open`. No sync engine: a refresh is the replica query with its cursor (ADR 0227 row). While the phone
 *           saves (Low Power Mode or an expensive connection, `SystemSettings`) the background refreshes wait, and run
 *           once it stops; an explicit `refresh` still runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 2 to 4); ADR 0315 (live queries); ADR 0343 (decision 4); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import { MemorySystemSettingsDriver } from "@stackra/platform";
import type { Platform, SystemSettings } from "@stackra/platform/contracts";
import type { RealtimeConnection } from "@stackra/realtime";
import { StorageArea } from "@stackra/storage";
import { duration } from "@stackra/validation";

import type { QueryConfig } from "#config/query.config";
import type { QueryPersister } from "#contracts/ports/query-persister.port";
import type { ReplicaSource } from "#contracts/ports/replica-source.port";
import type { ReplicaRow } from "#contracts/types/replica-row.type";
import { PERSISTED_REPLICA_SCHEMA } from "#core/constants/persisted-replica-schema.constant";
import { REPLICA_CHANGES_SCHEMA } from "#core/constants/replica-changes-schema.constant";
import { REPLICAS } from "#core/constants/replicas.constant";
import { partitionKey } from "#core/functions/partition-key.function";
import type { OfflineLock } from "#core/services/offline-lock.service";
import type { QueryPartition } from "#core/types/query-partition.type";
import type { ReplicaRef } from "#core/types/replica-ref.type";
import type { ReplicaSnapshot } from "#core/types/replica-snapshot.type";

/** One replica as the store holds it. */
interface Replica {
  readonly cursor: string;
  readonly asOf: string;
  readonly rows: readonly ReplicaRow[];
  readonly snapshot: ReplicaSnapshot;
}

/** What a replica reads before its first fill. */
const UNFILLED: ReplicaSnapshot = Object.freeze({ data: Object.freeze([]), asOf: null });

/** Whether `row` belongs to the slice `value` of the dimension `scope`. */
function isInSlice(row: ReplicaRow, scope: string, value: string): boolean {
  return (
    typeof row.data === "object" &&
    row.data !== null &&
    !Array.isArray(row.data) &&
    row.data[scope] === value
  );
}

/**
 * The client's bounded replicas.
 *
 * @example
 * await replicas.open({ principal: session.user.userId, scope: activeScope }, { legalEntityId: "len_1" });
 * replicas.read(RecentSalesQuery); // { data: [...], asOf: Date }
 */
export class ReplicaStore extends Service {
  /**
   * Calls `listener` after every change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** A number that changes with every change of a replica; the snapshot `useReplica` reads. */
  readonly version = (): number => this.changes;

  private readonly config: QueryConfig;

  private readonly persister: QueryPersister;

  private readonly source: ReplicaSource;

  private readonly realtime: RealtimeConnection;

  private readonly platform: Platform;

  private readonly clock: Clock;

  private readonly settings: SystemSettings;

  /** Whether replicas are written to the `cache` area at all. */
  private readonly isPersisted: boolean;

  private readonly listeners = new Set<() => void>();

  private readonly stops: readonly (() => void)[];

  private signals: readonly (() => void)[] = [];

  private replicas = new Map<string, Replica>();

  private readonly refreshing = new Map<string, Promise<void>>();

  private changes = 0;

  private opens = 0;

  private saving: Promise<void> = Promise.resolve();

  /** The storage key prefix of the open partition; `undefined` while closed. */
  private partition: string | undefined;

  /** The device's slice of each scope dimension. */
  private slice: Readonly<Record<string, string>> = {};

  /**
   * @param config - the key scope and the persistence rules.
   * @param persister - keeps the replicas in the `cache` area.
   * @param source - answers a replica's changes since a cursor.
   * @param realtime - the refresh signals.
   * @param platform - the network signal.
   * @param clock - ages the records.
   * @param lock - closes the store when the device's offline data is wiped.
   * @param settings - Low Power Mode and an expensive connection, which hold the background refreshes; nothing saves
   *                   when absent.
   */
  constructor(
    config: QueryConfig,
    persister: QueryPersister,
    source: ReplicaSource,
    realtime: RealtimeConnection,
    platform: Platform,
    clock: Clock,
    lock: OfflineLock,
    settings: SystemSettings = new MemorySystemSettingsDriver(),
  ) {
    super();
    this.config = config;
    this.persister = persister;
    this.source = source;
    this.realtime = realtime;
    this.platform = platform;
    this.clock = clock;
    this.settings = settings;
    this.isPersisted =
      config.persistMaxAgeHours > 0 && (!config.persistEncrypted || persister.isEncrypted);
    this.stops = [
      platform.network.isOnline.subscribe((isOnline) => {
        if (isOnline) void this.refreshAll();
      }),
      lock.onWipe(() => this.close()),
      settings.lowPowerMode.subscribe(() => void this.refreshAll()),
      settings.expensiveNetwork.subscribe(() => void this.refreshAll()),
    ];
  }

  /** Stops listening to the network, the lock and the refresh signals when the container closes. */
  onApplicationShutdown(): void {
    this.unsubscribe();
    for (const stop of this.stops) stop();
  }

  /**
   * The records of `query`'s replica and its "as of" time; empty with `asOf: null` before the first fill.
   *
   * @throws TypeError when `query` was not declared a replica: it is not available offline.
   */
  read(query: ReplicaRef): ReplicaSnapshot {
    if (!REPLICAS.has(query.key))
      throw new TypeError(`${query.key} is not declared a replica, so it is not available offline`);
    return this.replicas.get(query.key)?.snapshot ?? UNFILLED;
  }

  /**
   * Opens the replicas of `partition` for the device's `slice`: restores what was persisted, listens to each replica's
   * refresh signal, and refreshes every replica when online.
   */
  async open(
    partition: QueryPartition,
    slice: Readonly<Record<string, string>> = {},
  ): Promise<void> {
    const prefix = `query.replica.${partitionKey(this.config.scope, partition)}`;
    const ticket = ++this.opens;
    this.unsubscribe();
    this.partition = undefined;
    this.replicas = new Map();
    this.publish();
    const refs = [...REPLICAS.values()];
    const restored = await Promise.all(refs.map((query) => this.restore(prefix, query)));
    if (ticket !== this.opens) return;
    this.partition = prefix;
    this.slice = slice;
    refs.forEach((query, index) => {
      const replica = restored[index];
      if (replica !== undefined) this.replicas.set(query.key, replica);
    });
    this.publish();
    this.signals = refs.flatMap((query) =>
      (query.invalidateOn ?? []).map((event) =>
        this.realtime.subscribe(event, () => {
          if (!this.isSaving()) void this.refresh(query).catch(() => undefined);
        }),
      ),
    );
    void this.refreshAll();
  }

  /**
   * Refreshes `query`'s replica: the whole replica the first time, then the changes since its cursor. A call while one
   * runs joins it.
   *
   * @throws Error the source's failure, or a `ZodError` for an answer that is not a replica's; the replica keeps what
   *         it holds.
   */
  refresh(query: ReplicaRef): Promise<void> {
    const partition = this.partition;
    if (partition === undefined) return Promise.resolve();
    const key = `${partition}.${query.key}`;
    const running = this.refreshing.get(key);
    if (running !== undefined) return running;
    const pulling = this.pull(partition, query).finally(() => this.refreshing.delete(key));
    this.refreshing.set(key, pulling);
    return pulling;
  }

  /** Whether the phone saves power or data, so background refreshes wait. */
  private isSaving(): boolean {
    return this.settings.lowPowerMode.get() || this.settings.expensiveNetwork.get();
  }

  /** Refreshes every replica when online and not saving; a failure leaves that replica as it was. */
  private async refreshAll(): Promise<void> {
    if (this.partition === undefined || !this.platform.network.isOnline.get() || this.isSaving())
      return;
    await Promise.allSettled([...REPLICAS.values()].map((query) => this.refresh(query)));
  }

  /** One refresh of `query` for `partition`. */
  private async pull(partition: string, query: ReplicaRef): Promise<void> {
    const scope = query.replica.scope;
    const value = scope === undefined ? undefined : this.slice[scope];
    // A replica scoped by a dimension the device has no slice of is not kept: nothing outside its slice may reach it.
    if (scope !== undefined && value === undefined) return;
    const held = this.replicas.get(query.key);
    const answer = REPLICA_CHANGES_SCHEMA.parse(
      await this.source.changes(
        query.key,
        held?.cursor ?? null,
        scope === undefined || value === undefined ? {} : { [scope]: value },
      ),
    );
    if (this.partition !== partition) return;
    const rows = new Map<string, ReplicaRow>(
      answer.full || held === undefined ? [] : held.rows.map((row) => [row.id, row] as const),
    );
    for (const id of answer.removed) rows.delete(id);
    for (const row of answer.rows)
      if (scope === undefined || value === undefined || isInSlice(row, scope, value))
        rows.set(row.id, row);
      else rows.delete(row.id);
    const replica = this.bounded(query, answer.cursor, answer.asOf, [...rows.values()]);
    this.replicas.set(query.key, replica);
    this.publish();
    this.persist(`${partition}.${query.key}`, replica);
  }

  /** The stored replica of `query` under `prefix`, bounded; `undefined` when none, unreadable or too old. */
  private async restore(prefix: string, query: ReplicaRef): Promise<Replica | undefined> {
    if (!this.isPersisted) return undefined;
    // A replica is disposable: one that cannot be read refills with a full download.
    const stored = await this.persister
      .read(StorageArea.Cache, `${prefix}.${query.key}`)
      .catch(() => undefined);
    const parsed = PERSISTED_REPLICA_SCHEMA.safeParse(stored);
    if (!parsed.success) return undefined;
    const age = this.clock.now().getTime() - Date.parse(parsed.data.asOf);
    if (age > Duration.toMilliseconds(Duration.hours(this.config.persistMaxAgeHours)))
      return undefined;
    return this.bounded(query, parsed.data.cursor, parsed.data.asOf, parsed.data.rows);
  }

  /** The replica of `rows` within `query`'s window and limit, newest first, with its frozen snapshot. */
  private bounded(
    query: ReplicaRef,
    cursor: string,
    asOf: string,
    rows: readonly ReplicaRow[],
  ): Replica {
    const oldest =
      this.clock.now().getTime() - Duration.toMilliseconds(duration(query.replica.window));
    const kept = rows
      .filter((row) => Date.parse(row.at) >= oldest)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
      .slice(0, query.replica.limit);
    return Object.freeze({
      cursor,
      asOf,
      rows: Object.freeze(kept),
      snapshot: Object.freeze({
        data: Object.freeze(kept.map((row) => row.data)),
        asOf: new Date(asOf),
      }),
    });
  }

  /** Writes `replica` under `key`, after every earlier write; a failed write keeps it in memory. */
  private persist(key: string, replica: Replica): void {
    if (!this.isPersisted) return;
    const { cursor, asOf, rows } = replica;
    const write = (): Promise<void> =>
      this.persister.write(StorageArea.Cache, key, { version: 1, cursor, asOf, rows });
    this.saving = this.saving.then(write, write).catch(() => undefined);
  }

  /** Closes the store and drops every replica, once every write in flight has landed; the lock wipes the area next. */
  private async close(): Promise<void> {
    this.unsubscribe();
    this.partition = undefined;
    this.opens += 1;
    this.replicas = new Map();
    this.publish();
    await this.saving;
  }

  /** Ends the refresh signals of the open partition. */
  private unsubscribe(): void {
    for (const stop of this.signals) stop();
    this.signals = [];
  }

  /** Counts a change and notifies every listener. */
  private publish(): void {
    this.changes += 1;
    for (const listener of this.listeners) listener();
  }
}
