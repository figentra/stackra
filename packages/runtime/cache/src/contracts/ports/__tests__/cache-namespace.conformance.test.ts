/**
 * Stackra file contract:
 * Purpose: the conformance test of the `CacheNamespace` promise (ADR 0150's enforcement): every `Cache` driver this
 *          package ships (memory, storage, valkey, workers), over one store, keeps two namespaces apart. A value put in
 *          one is not read, overwritten, loaded over or forgotten from the other, the shared namespace `""` sees
 *          neither, a namespace that is a prefix of another (`scp_a`, `scp_ab`) or holds `/` stays its own, and a
 *          `forgetTag` reaches only its own namespace's entries.
 * Boundary: test only; one driver per case with a settable namespace, as a scoped deployment has one driver whose
 *           namespace changes per call. `iovalkey` and the Worker binding are mocked in memory, so no server runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 2 and
 *                     its enforcement); ADR 0305 (rule 32); STA-1442.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock, Duration } from "@stackra/contracts";
import { fakeStorage } from "@stackra/storage/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";
import { MemoryCacheDriver } from "#core/drivers/memory-cache.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { StorageCacheDriver } from "#core/drivers/storage-cache.driver";
import { ValkeyCacheDriver } from "#node/drivers/valkey-cache.driver";
import { WorkersCacheDriver } from "#worker/drivers/workers-cache.driver";

/** The in-memory Valkey server and Workers KV namespace the mocked clients use. */
const stores = vi.hoisted(() => {
  const valkey = new Map<string, string>();
  const valkeySets = new Map<string, Set<string>>();
  const kv = new Map<string, string>();
  const namespace = {
    get: async (key: string) => kv.get(key) ?? null,
    put: async (key: string, value: string) => {
      kv.set(key, value);
    },
    delete: async (key: string) => {
      kv.delete(key);
    },
    list: async ({ prefix }: { prefix: string }) => ({
      keys: [...kv.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
    }),
  };
  return { valkey, valkeySets, kv, bindings: { CACHE: namespace } as Record<string, unknown> };
});

vi.mock("iovalkey", () => ({
  default: class {
    get = async (key: string) => stores.valkey.get(key) ?? null;

    set = async (key: string, value: string) => {
      stores.valkey.set(key, value);
      return "OK";
    };

    del = async (key: string) =>
      stores.valkey.delete(key) || stores.valkeySets.delete(key) ? 1 : 0;

    zadd = async (key: string, _gt: string, _score: number, member: string) => {
      stores.valkeySets.set(key, new Set([...(stores.valkeySets.get(key) ?? []), member]));
      return 1;
    };

    zremrangebyscore = async () => 0;

    pexpire = async () => 1;

    zrange = async (key: string) => [...(stores.valkeySets.get(key) ?? [])];
  },
}));

vi.mock("#worker/functions/worker-binding.function", () => ({
  workerBinding: (name: string) => stores.bindings[name],
}));

class ManualClock extends Clock {
  time = Date.parse("2026-10-28T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

/** The namespace a scoped deployment's driver reads on every call; the test moves it between calls. */
class SettableCacheNamespace extends CacheNamespace {
  name = "";

  current(): string {
    return this.name;
  }
}

/** A secret store holding only `CACHE_VALKEY_URL`. */
class ValkeySecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "CACHE_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

class Product {}

class Category {}

const TEN_MINUTES = Duration.minutes(10);

/** Runs `work` with the namespace set to `scope`. */
async function inside<T>(
  namespace: SettableCacheNamespace,
  scope: string,
  work: () => Promise<T>,
): Promise<T> {
  namespace.name = scope;
  return work();
}

/** Each shipped driver over a fresh store, by its driver name. */
const DRIVERS: Readonly<Record<string, (namespace: CacheNamespace, clock: Clock) => Cache>> = {
  memory: (namespace, clock) =>
    new MemoryCacheDriver(buildConfig(CacheConfig), namespace, clock, new NoneCacheMetricsDriver()),
  storage: (namespace, clock) =>
    new StorageCacheDriver(fakeStorage(), namespace, clock, new NoneCacheMetricsDriver()),
  valkey: (namespace, clock) =>
    new ValkeyCacheDriver(
      buildConfig(CacheConfig, { values: { driver: "valkey" }, secrets: new ValkeySecrets() }),
      namespace,
      clock,
      new LocalCacheLockDriver(),
      new NoneCacheMetricsDriver(),
    ),
  workers: (namespace, clock) =>
    new WorkersCacheDriver(
      buildConfig(CacheConfig, { values: { driver: "workers" } }),
      namespace,
      clock,
      new LocalCacheLockDriver(),
      new NoneCacheMetricsDriver(),
    ),
};

describe.each(Object.keys(DRIVERS))("the %s driver keeps two namespaces apart", (name) => {
  /** A fresh driver of `name` and its namespace, which starts in `scp_a`. */
  function setup(): { cache: Cache; namespace: SettableCacheNamespace } {
    stores.valkey.clear();
    stores.valkeySets.clear();
    stores.kv.clear();
    const namespace = new SettableCacheNamespace();
    namespace.name = "scp_a";
    const make = DRIVERS[name];
    if (make === undefined) throw new Error(`no driver ${name}`);
    return { cache: make(namespace, new ManualClock()), namespace };
  }

  const key = CacheKey.of(Product, "prd_1");

  it("does not read another namespace's value, nor does the shared namespace", async () => {
    const { cache, namespace } = setup();
    await cache.put(key, "a", TEN_MINUTES);
    await expect(inside(namespace, "scp_b", () => cache.get(key))).resolves.toBeUndefined();
    await expect(inside(namespace, "", () => cache.get(key))).resolves.toBeUndefined();
    await expect(inside(namespace, "scp_a", () => cache.get(key))).resolves.toBe("a");
  });

  it("keeps one key's value per namespace", async () => {
    const { cache, namespace } = setup();
    await cache.put(key, "a", TEN_MINUTES);
    await inside(namespace, "scp_b", () => cache.put(key, "b", TEN_MINUTES));
    await expect(inside(namespace, "scp_a", () => cache.get(key))).resolves.toBe("a");
    await expect(inside(namespace, "scp_b", () => cache.get(key))).resolves.toBe("b");
  });

  it("loads its own value in remember instead of serving another namespace's", async () => {
    const { cache, namespace } = setup();
    await cache.remember(key, TEN_MINUTES, () => "a");
    const load = vi.fn(() => "b");
    await expect(
      inside(namespace, "scp_b", () => cache.remember(key, TEN_MINUTES, load)),
    ).resolves.toBe("b");
    expect(load).toHaveBeenCalledOnce();
  });

  it("forgets only inside its own namespace", async () => {
    const { cache, namespace } = setup();
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "a", TEN_MINUTES);
    await inside(namespace, "scp_b", () =>
      cache.put(CacheKey.of(Product, "prd_1", "en"), "b", TEN_MINUTES),
    );
    await inside(namespace, "scp_b", () => cache.forget(CacheKey.of(Product)));
    await expect(
      inside(namespace, "scp_b", () => cache.get(CacheKey.of(Product, "prd_1", "en"))),
    ).resolves.toBeUndefined();
    await expect(
      inside(namespace, "scp_a", () => cache.get(CacheKey.of(Product, "prd_1", "en"))),
    ).resolves.toBe("a");
  });

  it("keeps a namespace that is a prefix of another, or holds a slash, its own", async () => {
    const { cache, namespace } = setup();
    await inside(namespace, "scp_ab", () => cache.put(key, "ab", TEN_MINUTES));
    await inside(namespace, "scp_a/x", () => cache.put(key, "slash", TEN_MINUTES));
    await inside(namespace, "scp_a", () => cache.forget(CacheKey.of(Product)));
    await expect(inside(namespace, "scp_ab", () => cache.get(key))).resolves.toBe("ab");
    await expect(inside(namespace, "scp_a/x", () => cache.get(key))).resolves.toBe("slash");
    await expect(inside(namespace, "scp_a", () => cache.get(key))).resolves.toBeUndefined();
  });
  it("forgets a tag only inside its own namespace", async () => {
    const { cache, namespace } = setup();
    const tag = CacheKey.of(Category, "cat_1");
    await cache.put(key, "a", TEN_MINUTES, { tags: [tag] });
    await inside(namespace, "scp_b", () => cache.put(key, "b", TEN_MINUTES, { tags: [tag] }));
    await inside(namespace, "scp_b", () => cache.forgetTag(tag));
    await expect(inside(namespace, "scp_b", () => cache.get(key))).resolves.toBeUndefined();
    await expect(inside(namespace, "scp_a", () => cache.get(key))).resolves.toBe("a");
  });
});
