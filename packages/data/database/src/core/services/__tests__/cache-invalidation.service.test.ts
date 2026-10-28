/**
 * Stackra file contract:
 * Purpose: unit tests of `CacheInvalidationService`: a changed row forgets `CacheKey.of(Model, id)` once per run, under
 *          the shared cache context, and a model the database does not know is skipped.
 * Boundary: test only; a recording stand-in cache and context storage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decision 3); ADR 0078 (decision 4); ADR 0022; data-layer gap ca4.
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import type { Cache } from "@stackra/cache/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { Database } from "#core/ports/database.port";
import { SHARED_CACHE_CONTEXT } from "#core/constants/shared-cache-context.constant";
import { CacheInvalidationService } from "#core/services/cache-invalidation.service";

/** A service over a cache and storage that record every call. */
function setup(): {
  service: CacheInvalidationService;
  forgotten: unknown[][];
  contexts: object[];
} {
  const forgotten: unknown[][] = [];
  const contexts: object[] = [];
  let current: object | undefined;
  const cache = {
    forget: (...args: unknown[]) => {
      forgotten.push([...args, current]);
      return Promise.resolve();
    },
  } as unknown as Cache;
  const storage = {
    run: <T>(value: object, work: () => T): T => {
      contexts.push(value);
      current = value;
      return work();
    },
    current: () => current,
  } as unknown as ContextStorage;
  class Product {}
  class Category {}
  const models = new Map<string, object>([
    ["Product", Product],
    ["Category", Category],
  ]);
  const database = {
    em: () => ({
      getMetadata: () => ({
        getByClassName: (name: string) =>
          models.has(name) ? { class: models.get(name) } : undefined,
      }),
    }),
  } as unknown as Database;
  return {
    service: new CacheInvalidationService(cache, storage, database),
    forgotten,
    contexts,
  };
}

describe("CacheInvalidationService", () => {
  it("forgets the changed row's key in the shared context", async () => {
    const { service, forgotten, contexts } = setup();
    await service.consume({ model: "Product", id: "prd_1" });
    expect(forgotten).toEqual([["Product:prd_1", SHARED_CACHE_CONTEXT]]);
    expect(contexts).toEqual([SHARED_CACHE_CONTEXT]);
  });

  it("skips a model the database does not know", async () => {
    const { service, forgotten } = setup();
    await service.consume({ model: "Unknown", id: "unk_1" });
    expect(forgotten).toEqual([]);
  });

  it("forgets each row of a run once", async () => {
    const { service, forgotten } = setup();
    await service.consumeMany([
      { model: "Product", id: "prd_1" },
      { model: "Product", id: "prd_1" },
      { model: "Category", id: "cat_2" },
    ]);
    expect(forgotten.map(([key]) => key)).toEqual(["Product:prd_1", "Category:cat_2"]);
  });
});
