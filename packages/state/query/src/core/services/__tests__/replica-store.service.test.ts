/**
 * Stackra file contract:
 * Purpose: unit tests of `ReplicaStore`: an empty replica reads `asOf: null` before its first fill and a query not
 *          declared a replica is refused; the first fill is the only full download, later refreshes send the cursor
 *          (on the refresh signal and on reconnect) and merge the changes and removals; a replica keeps its window and
 *          limit, newest first; a scoped replica asks for and keeps only the device's slice, and is not kept without
 *          one; replicas persist only through a persister they may use, restore within `persistMaxAgeHours` and keep
 *          what they hold when a refresh fails; a wipe drops everything; subscribers hear every change.
 * Boundary: test only; storage, the seal, the platform and the realtime connection are the real memory drivers or the
 *           realtime fake, the source is a small class of its port, and the lock is a stand-in that runs its listeners.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decisions 2 to 4); ADR 0315.
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Service } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { MemoryPlatformDriver } from "@stackra/platform";
import { fakeRealtime } from "@stackra/realtime/testing";
import { MemoryPayloadSealDriver, MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";

import { QueryConfig } from "#config/query.config";
import { ReplicaSource } from "#contracts/ports/replica-source.port";
import type { ReplicaChanges } from "#contracts/types/replica-changes.type";
import { StorageQueryPersisterDriver } from "#core/drivers/storage-query-persister.driver";
import { registerReplicas } from "#core/functions/register-replicas.function";
import { OfflineLock } from "#core/services/offline-lock.service";
import { ReplicaStore } from "#core/services/replica-store.service";
import type { ReplicaRef } from "#core/types/replica-ref.type";

const NOW = new Date("2026-10-24T09:00:00.000Z");

const HOUR_MS = 60 * 60 * 1000;

const USER = { principal: "usr_1", scope: { id: "scp_wsp1", path: "platform.wsp1" } } as const;

class SaleRecorded {
  static readonly eventName = "sales.sale.recorded.v1";
}

class RecentSalesQuery {
  static readonly key = "sales.sale.recent@1";

  static readonly replica = { of: "sales.sale", window: "30d", limit: 2 };

  static readonly invalidateOn = [SaleRecorded];
}

class CustomersQuery {
  static readonly key = "crm.customer.list@1";

  static readonly replica = {
    of: "crm.customer",
    window: "365d",
    limit: 100,
    scope: "legalEntityId",
  };
}

class OrdersQuery {
  static readonly key = "orders.order.list@1";
}

registerReplicas([RecentSalesQuery, CustomersQuery]);

/** A row of `id`, `hours` old. */
const row = (id: string, hours: number, data: Record<string, string> = {}) => ({
  id,
  at: new Date(NOW.getTime() - hours * HOUR_MS).toISOString(),
  data: { id, ...data },
});

/** An answer: a full fill unless `cursor` says it follows one. */
const answer = (
  rows: ReplicaChanges["rows"],
  cursor: string,
  removed: readonly string[] = [],
): ReplicaChanges => ({ rows, removed, cursor, asOf: NOW.toISOString(), full: cursor === "c1" });

/** A clock a test moves by setting `at`. */
class TestClock extends Clock {
  at = NOW.getTime();

  now(): Date {
    return new Date(this.at);
  }
}

/** A source that records each ask and answers from `answers`, in turn per query. */
class ScriptedSource extends ReplicaSource {
  readonly asked: [string, string | null, Readonly<Record<string, string>>][] = [];

  answers = new Map<string, (() => Promise<ReplicaChanges>)[]>();

  changes(
    query: string,
    cursor: string | null,
    slice: Readonly<Record<string, string>>,
  ): Promise<ReplicaChanges> {
    this.asked.push([query, cursor, slice]);
    const next = this.answers.get(query)?.shift();
    return next === undefined ? Promise.reject(new Error("no answer")) : next();
  }

  /** Queues `changes` as the next answers for `query`. */
  queue(query: string, ...changes: ReplicaChanges[]): void {
    const list = this.answers.get(query) ?? [];
    list.push(...changes.map((value) => () => Promise.resolve(value)));
    this.answers.set(query, list);
  }
}

/** A lock stand-in whose `wipe` runs its listeners, as the real one does before it clears storage. */
function lockOf() {
  const listeners = new Set<() => void | Promise<void>>();
  return Object.assign(Object.create(OfflineLock.prototype) as OfflineLock, {
    onWipe: (listener: () => void | Promise<void>) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    wipe: async () => {
      await Promise.all([...listeners].map(async (listener) => listener()));
    },
  });
}

/** Lets fire-and-forget writes land. */
const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** A store over memory storage; not opened. */
function storeOf(
  values: Partial<ConfigValues<QueryConfig>> = {},
  storage = new MemoryStorageDriver(),
  clock = new TestClock(),
) {
  const source = new ScriptedSource();
  const realtime = fakeRealtime();
  const platform = new MemoryPlatformDriver();
  const lock = lockOf();
  const store = new ReplicaStore(
    buildConfig(QueryConfig, { values }),
    new StorageQueryPersisterDriver(storage, new MemoryPayloadSealDriver(storage)),
    source,
    realtime,
    platform,
    clock,
    lock,
  );
  return { store, source, realtime, platform, lock, storage, clock };
}

/** The ids `query`'s replica reads, in order. */
const idsOf = (store: ReplicaStore, query: ReplicaRef) =>
  store.read(query).data.map((data) => (data as { id: string }).id);

describe("ReplicaStore", () => {
  it("reads an empty replica before its first fill and refuses a query not declared a replica", () => {
    const { store } = storeOf();
    expect(store).toBeInstanceOf(Service);
    expect(store.read(RecentSalesQuery)).toEqual({ data: [], asOf: null });
    expect(() => store.read(OrdersQuery as unknown as ReplicaRef)).toThrow(TypeError);
  });

  it("fills once, then merges the changes since its cursor on the refresh signal and on reconnect, newest first within its window and limit", async () => {
    const { store, source, realtime, platform, storage } = storeOf();
    source.queue(
      RecentSalesQuery.key,
      answer([row("sal_1", 24), row("sal_2", 40 * 24), row("sal_3", 2)], "c1"),
      answer([row("sal_4", 1)], "c2", ["sal_1"]),
      answer([row("sal_5", 0)], "c3"),
    );
    await store.open(USER);
    await store.refresh(RecentSalesQuery);
    expect(source.asked[0]).toEqual([RecentSalesQuery.key, null, {}]);
    expect(idsOf(store, RecentSalesQuery)).toEqual(["sal_3", "sal_1"]);
    expect(store.read(RecentSalesQuery).asOf).toEqual(NOW);
    realtime.emit(SaleRecorded);
    await store.refresh(RecentSalesQuery);
    expect(source.asked.at(-1)).toEqual([RecentSalesQuery.key, "c1", {}]);
    expect(idsOf(store, RecentSalesQuery)).toEqual(["sal_4", "sal_3"]);
    platform.network.isOnline.set(false);
    platform.network.isOnline.set(true);
    await store.refresh(RecentSalesQuery);
    expect(source.asked.at(-1)).toEqual([RecentSalesQuery.key, "c2", {}]);
    expect(idsOf(store, RecentSalesQuery)).toEqual(["sal_5", "sal_4"]);
    // The memory seal does not encrypt, so with persistEncrypted on nothing rests in the cache area.
    await settle();
    expect(storage.cache.keys()).toEqual([]);
    store.onApplicationShutdown();
  });

  it("keeps a scoped replica to the device's slice, and keeps none without a slice", async () => {
    const { store, source } = storeOf();
    source.queue(
      CustomersQuery.key,
      answer(
        [row("cus_1", 1, { legalEntityId: "len_1" }), row("cus_2", 1, { legalEntityId: "len_2" })],
        "c1",
      ),
    );
    await store.open(USER);
    expect(source.asked.filter(([query]) => query === CustomersQuery.key)).toEqual([]);
    await store.open(USER, { legalEntityId: "len_1" });
    await store.refresh(CustomersQuery);
    expect(source.asked.at(-1)).toEqual([CustomersQuery.key, null, { legalEntityId: "len_1" }]);
    expect(idsOf(store, CustomersQuery)).toEqual(["cus_1"]);
    store.onApplicationShutdown();
  });

  it("persists through a persister it may use, restores within persistMaxAgeHours and keeps what it holds when a refresh fails", async () => {
    const storage = new MemoryStorageDriver();
    const values = { persistEncrypted: false };
    const first = storeOf(values, storage);
    first.source.queue(RecentSalesQuery.key, answer([row("sal_1", 1)], "c1"));
    await first.store.open(USER);
    await first.store.refresh(RecentSalesQuery);
    await settle();
    expect(storage.cache.keys()).toHaveLength(1);
    const second = storeOf(values, storage);
    await second.store.open(USER);
    expect(idsOf(second.store, RecentSalesQuery)).toEqual(["sal_1"]);
    await expect(second.store.refresh(RecentSalesQuery)).rejects.toThrow("no answer");
    expect(second.source.asked[0]).toEqual([RecentSalesQuery.key, "c1", {}]);
    expect(second.store.read(RecentSalesQuery)).toEqual({ data: [{ id: "sal_1" }], asOf: NOW });
    const later = new TestClock();
    later.at += 25 * HOUR_MS;
    const third = storeOf(values, storage, later);
    await third.store.open(USER);
    expect(third.store.read(RecentSalesQuery)).toEqual({ data: [], asOf: null });
    for (const opened of [first, second, third]) opened.store.onApplicationShutdown();
  });

  it("drops every replica and its refresh signal on a wipe, and tells its subscribers", async () => {
    const { store, source, realtime, lock } = storeOf();
    source.queue(RecentSalesQuery.key, answer([row("sal_1", 1)], "c1"));
    await store.open(USER);
    await store.refresh(RecentSalesQuery);
    const before = store.version();
    let heard = 0;
    const stop = store.subscribe(() => {
      heard += 1;
    });
    await lock.wipe();
    expect(store.read(RecentSalesQuery)).toEqual({ data: [], asOf: null });
    expect(store.version()).toBeGreaterThan(before);
    expect(heard).toBeGreaterThan(0);
    stop();
    const asked = source.asked.length;
    realtime.emit(SaleRecorded);
    await store.refresh(RecentSalesQuery);
    expect(source.asked).toHaveLength(asked);
    store.onApplicationShutdown();
  });
});
