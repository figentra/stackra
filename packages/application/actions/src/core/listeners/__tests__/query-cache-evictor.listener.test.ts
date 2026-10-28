/**
 * Stackra file contract:
 * Purpose: unit tests of `QueryCacheEvictorListener`: after an event it forgets each query the event makes stale in the
 *          event's tenant (every tenant for a platform event), in the shared namespace even inside a scoped call, and
 *          leaves other queries and other tenants alone.
 * Boundary: test only; the cache is a recording stand-in and the storage the `AsyncLocalStorage` driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 31); ADR 0150 (decision 3).
 */
import { Cache } from "@stackra/cache/contracts";
import type { CacheKey } from "@stackra/cache";
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { IntegrationEvent, type ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { QUERY_CACHE_EVICTIONS } from "#core/constants/query-cache-evictions.constant";
import { QueryCacheEvictorListener } from "#core/listeners/query-cache-evictor.listener";
import { AsyncContextStorageDriver } from "#node/drivers/async-context-storage.driver";

class PointsEarned extends IntegrationEvent({ name: "points.earned" }) {}

class PointsExpired extends IntegrationEvent({ name: "points.expired" }) {}

class GetBalanceQuery {}

class GetTierQuery {}

/** Records each forgotten key with the scope id current when it was forgotten. */
class ForgettingCache extends Driver(Cache) {
  readonly forgotten: string[] = [];

  private readonly storage: AsyncContextStorageDriver;

  constructor(storage: AsyncContextStorageDriver) {
    super();
    this.storage = storage;
  }

  async get<T>(): Promise<T | undefined> {
    return undefined;
  }

  async put(): Promise<void> {}

  async remember<T>(_key: CacheKey, _ttl: unknown, load: () => T | Promise<T>): Promise<T> {
    return load();
  }

  async forget(key: CacheKey): Promise<void> {
    const scope = (this.storage.current() as { scope?: ScopeRef } | undefined)?.scope;
    this.forgotten.push(`${scope?.id ?? ""}/${key}`);
  }

  async forgetTag(): Promise<void> {}
}

/** The context of an event delivered in `scopeId`. */
function contextOf(scopeId?: string): ListenerContext {
  return {
    eventId: "evt_1",
    occurredAt: new Date("2026-10-28T10:00:00.000Z"),
    ...(scopeId === undefined ? {} : { scopeId }),
    now: () => new Date("2026-10-28T10:00:00.000Z"),
  };
}

describe(QueryCacheEvictorListener, () => {
  QUERY_CACHE_EVICTIONS.set(PointsEarned, [GetBalanceQuery, GetTierQuery]);
  QUERY_CACHE_EVICTIONS.set(PointsExpired, [GetBalanceQuery]);

  it("forgets every stale query in the event's tenant, in the shared namespace even inside a scoped call", async () => {
    const storage = new AsyncContextStorageDriver();
    const cache = new ForgettingCache(storage);
    const listener = new QueryCacheEvictorListener(cache, storage);
    const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
    await storage.run({ scope }, () => listener.handle(new PointsEarned(), contextOf("ten_1")));
    expect(cache.forgotten).toEqual(["/GetBalanceQuery:ten_1", "/GetTierQuery:ten_1"]);
  });

  it("forgets every tenant's entries for a platform event, and only the queries the event names", async () => {
    const storage = new AsyncContextStorageDriver();
    const cache = new ForgettingCache(storage);
    await new QueryCacheEvictorListener(cache, storage).handle(new PointsExpired(), contextOf());
    expect(cache.forgotten).toEqual(["/GetBalanceQuery"]);
  });
});
