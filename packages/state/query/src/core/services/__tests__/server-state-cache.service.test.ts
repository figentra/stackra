/**
 * Stackra file contract:
 * Purpose: unit tests of `ServerStateCache`: the TanStack client takes `QueryConfig`'s read defaults, opening a
 *          partition empties it, results are persisted after a change and restored under the same buster within the
 *          age limit, nothing is persisted through a plain persister while encryption is required, and a watched query
 *          is invalidated on each broadcast of its `invalidateOn` events, with subscriptions shared between watchers and
 *          ended by the last one or by shutdown.
 * Boundary: test only; the realtime connection is `@stackra/realtime`'s fake, storage the real memory driver, and the
 *           encrypting persister and the clock small classes of their ports. Timers are faked for the persist delay.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079 (decision 1); ADR 0059 (decision 1); R-25 (live queries).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Service } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { fakeRealtime } from "@stackra/realtime/testing";
import { MemoryStorageDriver } from "@stackra/storage";
import type { StorageArea } from "@stackra/storage";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { QueryConfig } from "#config/query.config";
import { QueryPersister } from "#contracts/ports/query-persister.port";
import { StorageQueryPersisterDriver } from "#core/drivers/storage-query-persister.driver";
import { ServerStateCache } from "#core/services/server-state-cache.service";

const NOW = new Date("2026-10-24T09:00:00.000Z");

const HOUR_MS = 60 * 60 * 1000;

const USER = { principal: "usr_1", scope: { id: "scp_wsp1", path: "platform.wsp1" } } as const;

class OrderPaid {
  static readonly eventName = "orders.order.paid.v1";
}

class StockLow {
  static readonly eventName = "inventory.stock.low.v1";
}

class OrderKpisQuery {
  static readonly key = "orders.order.kpis@1";

  static readonly invalidateOn = [OrderPaid, StockLow];
}

class GetOrderQuery {
  static readonly key = "orders.order.get@1";
}

const KPIS = [OrderKpisQuery.key, {}];

/** A clock a test moves by setting `at`. */
class TestClock extends Clock {
  at = NOW.getTime();

  now(): Date {
    return new Date(this.at);
  }
}

/** A persister that encrypts (by its own account) and keeps JSON copies in memory. */
class EncryptedPersister extends QueryPersister {
  readonly isEncrypted = true;

  readonly kept = new Map<string, Json>();

  read(area: StorageArea, key: string): Promise<Json | undefined> {
    return Promise.resolve(this.kept.get(`${area}:${key}`));
  }

  write(area: StorageArea, key: string, value: unknown): Promise<void> {
    this.kept.set(`${area}:${key}`, JSON.parse(JSON.stringify(value)) as Json);
    return Promise.resolve();
  }
}

/** A cache over `persister`, with `values` as the configuration layer. */
function cacheOf(
  persister: QueryPersister = new EncryptedPersister(),
  values: Partial<ConfigValues<QueryConfig>> = {},
  clock = new TestClock(),
) {
  const realtime = fakeRealtime();
  const cache = new ServerStateCache(
    buildConfig(QueryConfig, { values }),
    persister,
    realtime,
    clock,
  );
  return { cache, realtime, clock };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ServerStateCache", () => {
  it("is a service whose client takes the configured read defaults", () => {
    const { cache } = cacheOf(new EncryptedPersister(), {
      staleTimeSeconds: 30,
      retry: 2,
      refetchOnFocus: false,
    });
    expect(cache).toBeInstanceOf(Service);
    expect(cache.client.getDefaultOptions().queries).toMatchObject({
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 24 * HOUR_MS,
    });
    const plain = cacheOf(new StorageQueryPersisterDriver(new MemoryStorageDriver())).cache;
    expect(plain.client.getDefaultOptions().queries?.gcTime).toBeUndefined();
  });

  it("empties the client when it opens a partition", async () => {
    const { cache } = cacheOf();
    await cache.open(USER, "b1");
    cache.client.setQueryData(KPIS, { total: 3 });
    await cache.open({ principal: "usr_2", scope: null }, "b1");
    expect(cache.client.getQueryData(KPIS)).toBeUndefined();
  });

  it("persists results after a change and restores them under the same buster", async () => {
    vi.useFakeTimers();
    const persister = new EncryptedPersister();
    const { cache } = cacheOf(persister);
    await cache.open(USER, "b1");
    cache.client.setQueryData(KPIS, { total: 3 });
    expect(persister.kept.size).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect([...persister.kept.keys()]).toEqual(["cache:query.cache.usr_1.scp_wsp1"]);
    const restored = cacheOf(persister).cache;
    await restored.open(USER, "b1");
    expect(restored.client.getQueryData(KPIS)).toEqual({ total: 3 });
  });

  it("drops a stored cache under another buster or past its age", async () => {
    vi.useFakeTimers();
    const persister = new EncryptedPersister();
    const { cache } = cacheOf(persister);
    await cache.open(USER, "b1");
    cache.client.setQueryData(KPIS, { total: 3 });
    await vi.advanceTimersByTimeAsync(1000);
    const rebuilt = cacheOf(persister).cache;
    await rebuilt.open(USER, "b2");
    expect(rebuilt.client.getQueryData(KPIS)).toBeUndefined();
    const later = new TestClock();
    later.at += 25 * HOUR_MS;
    const aged = cacheOf(persister, {}, later).cache;
    await aged.open(USER, "b1");
    expect(aged.client.getQueryData(KPIS)).toBeUndefined();
  });

  it("never persists through a plain persister while encryption is required", async () => {
    vi.useFakeTimers();
    const storage = new MemoryStorageDriver();
    const { cache } = cacheOf(new StorageQueryPersisterDriver(storage));
    await cache.open(USER, "b1");
    cache.client.setQueryData(KPIS, { total: 3 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(storage.cache.keys()).toEqual([]);
    const allowed = cacheOf(new StorageQueryPersisterDriver(storage), {
      persistEncrypted: false,
    }).cache;
    await allowed.open(USER, "b1");
    allowed.client.setQueryData(KPIS, { total: 4 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(storage.cache.keys()).toEqual(["query.cache.usr_1.scp_wsp1"]);
  });

  it("invalidates a watched query on each broadcast of its invalidateOn events", async () => {
    const { cache, realtime } = cacheOf();
    await cache.open(USER, "b1");
    cache.client.setQueryData(KPIS, { total: 3 });
    cache.client.setQueryData([GetOrderQuery.key, { orderId: "ord_1" }], { orderId: "ord_1" });
    const stop = cache.watch(OrderKpisQuery);
    realtime.emit(OrderPaid);
    expect(cache.client.getQueryState(KPIS)?.isInvalidated).toBe(true);
    expect(
      cache.client.getQueryState([GetOrderQuery.key, { orderId: "ord_1" }])?.isInvalidated,
    ).toBe(false);
    cache.client.setQueryData(KPIS, { total: 4 });
    realtime.emit(StockLow);
    expect(cache.client.getQueryState(KPIS)?.isInvalidated).toBe(true);
    stop();
  });

  it("shares subscriptions between watchers and ends them with the last one", async () => {
    const { cache, realtime } = cacheOf();
    await cache.open(USER, "b1");
    const subscribe = vi.spyOn(realtime, "subscribe");
    const first = cache.watch(OrderKpisQuery);
    const second = cache.watch(OrderKpisQuery);
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(cache.watch(GetOrderQuery)).toBeTypeOf("function");
    expect(subscribe).toHaveBeenCalledTimes(2);
    first();
    first();
    cache.client.setQueryData(KPIS, { total: 3 });
    realtime.emit(OrderPaid);
    expect(cache.client.getQueryState(KPIS)?.isInvalidated).toBe(true);
    second();
    cache.client.setQueryData(KPIS, { total: 4 });
    realtime.emit(OrderPaid);
    expect(cache.client.getQueryState(KPIS)?.isInvalidated).toBe(false);
  });

  it("ends every live subscription on shutdown", async () => {
    const { cache, realtime } = cacheOf();
    await cache.open(USER, "b1");
    cache.watch(OrderKpisQuery);
    cache.onApplicationShutdown();
    cache.client.setQueryData(KPIS, { total: 3 });
    realtime.emit(OrderPaid);
    expect(cache.client.getQueryState(KPIS)?.isInvalidated).toBe(false);
  });
});
