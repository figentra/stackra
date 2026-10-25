/**
 * Stackra file contract:
 * Purpose: unit tests of `ServerStateCache`: the TanStack client takes `QueryConfig`'s read defaults, opening a
 *          partition and a wipe of the device empty it, nothing is written to storage (a query that is not a replica is
 *          not available offline), and a watched query is invalidated on each broadcast of its `invalidateOn` events,
 *          with subscriptions shared between watchers and ended by the last one or by shutdown.
 * Boundary: test only; the realtime connection is `@stackra/realtime`'s fake; the lock is a stand-in that runs its wipe
 *           listeners on demand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079 (decision 1); ADR 0338 (decisions 3 and 4); R-25 (live queries).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Service } from "@stackra/container";
import { fakeRealtime } from "@stackra/realtime/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { QueryConfig } from "#config/query.config";
import { OfflineLock } from "#core/services/offline-lock.service";
import { ServerStateCache } from "#core/services/server-state-cache.service";

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

/** A lock stand-in whose `wipe` runs its listeners, as the real one does before it clears storage. */
function lockOf() {
  const listeners = new Set<() => void | Promise<void>>();
  const lock = Object.assign(Object.create(OfflineLock.prototype) as OfflineLock, {
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
  return lock;
}

/** A cache with `values` as the configuration layer. */
function cacheOf(values: Partial<ConfigValues<QueryConfig>> = {}) {
  const realtime = fakeRealtime();
  const lock = lockOf();
  const cache = new ServerStateCache(buildConfig(QueryConfig, { values }), realtime, lock);
  return { cache, realtime, lock };
}

describe("ServerStateCache", () => {
  it("is a service whose client takes the configured read defaults", () => {
    const { cache } = cacheOf({ staleTimeSeconds: 30, retry: 2, refetchOnFocus: false });
    expect(cache).toBeInstanceOf(Service);
    expect(cache.client.getDefaultOptions().queries).toMatchObject({
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    });
  });

  it("empties the client when it opens a partition", () => {
    const { cache } = cacheOf();
    cache.open(USER);
    cache.client.setQueryData(KPIS, { total: 3 });
    cache.open({ principal: "usr_2", scope: null });
    expect(cache.client.getQueryData(KPIS)).toBeUndefined();
  });

  it("empties the client when the lock wipes the device, and not after shutdown", async () => {
    const { cache, lock } = cacheOf();
    cache.client.setQueryData(KPIS, { total: 3 });
    await lock.wipe();
    expect(cache.client.getQueryData(KPIS)).toBeUndefined();
    cache.client.setQueryData(KPIS, { total: 4 });
    cache.onApplicationShutdown();
    await lock.wipe();
    expect(cache.client.getQueryData(KPIS)).toEqual({ total: 4 });
  });

  it("invalidates a watched query on each broadcast of its invalidateOn events", () => {
    const { cache, realtime } = cacheOf();
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

  it("shares subscriptions between watchers and ends them with the last one", () => {
    const { cache, realtime } = cacheOf();
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

  it("ends every live subscription on shutdown", () => {
    const { cache, realtime } = cacheOf();
    cache.watch(OrderKpisQuery);
    cache.onApplicationShutdown();
    cache.client.setQueryData(KPIS, { total: 3 });
    realtime.emit(OrderPaid);
    expect(cache.client.getQueryState(KPIS)?.isInvalidated).toBe(false);
  });
});
