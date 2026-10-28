/**
 * Stackra file contract:
 * Purpose: unit tests of `entityCacheOf`: a `Cached` model's read by `{ id }` outside a transaction gets the key with
 *          the call's tenant and scope node and the lifetime; any other read, a transaction or another result cache
 *          reads the database.
 * Boundary: test only; a stand-in entity manager and resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decisions 2 and 5); ADR 0022; data-layer gap ca5.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { ContextStorage } from "@stackra/actions/contracts";
import { Duration } from "@stackra/contracts";
import { Cached, HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
import { entityCacheOf } from "#core/functions/entity-cache-of.function";
import { EntityResultCacheAdapter } from "#core/orm/entity-result-cache.adapter";

class Product extends Model.with(HasPublicId("prd"), Cached({ ttl: Duration.minutes(10) })) {}

class Note extends Model.with(HasPublicId("not")) {}

/** An entity manager with or without a running transaction, over the given result-cache adapter. */
function em(inTransaction = false, adapter: unknown = EntityResultCacheAdapter): EntityManager {
  return {
    isInTransaction: () => inTransaction,
    config: { get: () => ({ adapter }) },
  } as unknown as EntityManager;
}

afterEach(() => connectVisibilityFilter(undefined));

describe(entityCacheOf, () => {
  it("keys a read by id with the call's tenant and scope node", () => {
    const context = { scopeId: "ten_1", scope: { id: "scp_1", path: "platform.acme" } };
    connectVisibilityFilter({
      has: (token) => token === ContextStorage,
      get: (() => ({ current: () => context })) as never,
    });
    expect(entityCacheOf(em(), Product, { id: "prd_1" })).toEqual([
      "Product:prd_1:ten_1:scp_1",
      600_000,
    ]);
  });

  it("keys a platform read with placeholders", () => {
    expect(entityCacheOf(em(), Product, { id: "prd_1" })).toEqual(["Product:prd_1:-:-", 600_000]);
  });

  it("reads the database for any other read", () => {
    expect(entityCacheOf(em(), Note, { id: "not_1" })).toBeUndefined();
    expect(entityCacheOf(em(), Product, { id: "prd_1", status: "live" })).toBeUndefined();
    expect(entityCacheOf(em(), Product, { $and: [{ id: "prd_1" }, { ownerId: "usr_1" }] })).toBe(
      undefined,
    );
    expect(entityCacheOf(em(true), Product, { id: "prd_1" })).toBeUndefined();
    expect(entityCacheOf(em(false, class {}), Product, { id: "prd_1" })).toBeUndefined();
  });
});
