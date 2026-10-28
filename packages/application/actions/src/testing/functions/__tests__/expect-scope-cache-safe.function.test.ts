/**
 * Stackra file contract:
 * Purpose: unit tests of `expectScopeCacheSafe`: it throws before a testing app compiled; it passes when every caller
 *          the query answers gets one answer, skipping a refused caller; it fails when the answer depends on the
 *          caller, when fewer than two callers get an answer, and for one caller or callers of two tenants; the cache
 *          step is off, so a bound cache cannot hide the difference.
 * Boundary: test only; the fixture binds a map `Cache` that would answer every caller from the first entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0305 (rule 31, as amended 2026-10-28).
 */
import type { CacheKey } from "@stackra/cache";
import { Cache } from "@stackra/cache/contracts";
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { type Actor, ActorKind, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessControl, type CallDescriptor } from "#contracts/index";
import { CacheScope, Query, type QueryContext } from "#core/index";
import "#testing/index";
import { expectScopeCacheSafe } from "#testing/functions/expect-scope-cache-safe.function";

/** Allows every caller but `usr_denied`. */
class AllowMost extends Driver(AccessControl) {
  async require(call: CallDescriptor): Promise<void> {
    if (call.actor.id === "usr_denied") throw ForbiddenError.create();
  }

  async authorize(): Promise<void> {}
}

/** A cache that answers every key with the first value it stored. */
class StickyCache extends Driver(Cache) {
  private value: unknown;

  private stored = false;

  async get<T>(): Promise<T | undefined> {
    return this.value as T | undefined;
  }

  async put<T>(_key: CacheKey, value: T): Promise<void> {
    this.value = value;
    this.stored = true;
  }

  async remember<T>(_key: CacheKey, _ttl: unknown, load: () => T | Promise<T>): Promise<T> {
    if (!this.stored) await this.put(_key, await load());
    return this.value as T;
  }

  async forget(): Promise<void> {
    this.stored = false;
  }

  async forgetTag(): Promise<void> {
    this.stored = false;
  }
}

class PriceListQuery extends Query({
  key: "catalog.price_list",
  actors: [ActorKind.User],
  cache: { ttl: "5m", per: CacheScope.Scope },
}) {
  async handle(_input: object, _ctx: QueryContext): Promise<{ prices: number[] }> {
    return { prices: [100, 250] };
  }
}

class MyOrdersQuery extends Query({
  key: "order.mine",
  actors: [ActorKind.User],
  cache: { ttl: "5m", per: CacheScope.Scope },
}) {
  async handle(_input: object, ctx: QueryContext): Promise<{ owner: string }> {
    return { owner: ctx.actor.id };
  }
}

class ScopeCacheFixtureModule extends Module {}

registerWiring({
  member: "scope_cache_fixture",
  root: ScopeCacheFixtureModule,
  bindings: [
    { module: "scope_cache_fixture", provide: PriceListQuery, deps: [] },
    { module: "scope_cache_fixture", provide: MyOrdersQuery, deps: [] },
  ],
});

/** A customer of `ten_1` with the id given. */
function customer(id: string, scopeId = "ten_1"): Actor {
  return { kind: ActorKind.User, id: id as Actor["id"], realm: Realm.Customer, scopeId } as Actor;
}

/** The fixture app with the access control and the sticky cache. */
function compile() {
  return createTestingModule(ScopeCacheFixtureModule)
    .override(AccessControl, new AllowMost())
    .override(Cache, new StickyCache())
    .compile();
}

describe(expectScopeCacheSafe, () => {
  it("throws before an app compiled", async () => {
    await expect(
      expectScopeCacheSafe(PriceListQuery, {}, { as: [customer("usr_1"), customer("usr_2")] }),
    ).rejects.toThrow(/createTestingModule/);
  });

  it("passes when every answered caller gets one answer, skipping a refused one", async () => {
    await compile();
    await expect(
      expectScopeCacheSafe(
        PriceListQuery,
        {},
        { as: [customer("usr_1"), customer("usr_denied"), customer("usr_2")] },
      ),
    ).resolves.toBeUndefined();
  });

  it("fails when the answer depends on the caller, with the cache step off", async () => {
    await compile();
    await expect(
      expectScopeCacheSafe(MyOrdersQuery, {}, { as: [customer("usr_1"), customer("usr_2")] }),
    ).rejects.toThrow(/answers usr_1 and usr_2 differently/);
  });

  it("refuses too few callers, callers of two tenants and too few answers", async () => {
    await compile();
    await expect(
      expectScopeCacheSafe(PriceListQuery, {}, { as: [customer("usr_1")] }),
    ).rejects.toThrow(TypeError);
    await expect(
      expectScopeCacheSafe(
        PriceListQuery,
        {},
        { as: [customer("usr_1"), customer("usr_2", "ten_2")] },
      ),
    ).rejects.toThrow(/one tenant/);
    await expect(
      expectScopeCacheSafe(PriceListQuery, {}, { as: [customer("usr_1"), customer("usr_denied")] }),
    ).rejects.toThrow(/fewer than two/);
  });
});
