/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyCacheDriver` on a real Valkey: entries, sorted sets and their lifetimes as the
 *          server keeps them. A value put by one instance is read by another; the server reclaims an entry and its
 *          sets once their lifetimes pass; a set is extended for a longer member, never shortened for a shorter one,
 *          and never lives forever; a dead member leaves a set that lives on at the next add; `forget` and
 *          `forgetTag` reach the entries another instance wrote and only them; `remember` serves a stale entry inside
 *          its window while one reload replaces it; two namespaces stay apart on one server.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Valkey (`useValkey`). Each test has a key
 *           prefix of its own; the clock is the system clock, since the server's `PX` runs on real time.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0305 (rule 32); ADR 0182 (integration tier); STA-2802.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { SystemClockDriver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CacheConfig } from "#config/cache.config";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { useValkey } from "#node/__tests__/fixtures/valkey.fixture";
import { ValkeyCacheDriver } from "#node/drivers/valkey-cache.driver";

const valkey = useValkey();

/** The fixture's server as the `CACHE_VALKEY_URL` secret. */
class CacheSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "CACHE_VALKEY_URL" ? valkey.url : undefined;
  }
}

/** The namespace a scoped deployment's driver reads on every call; the test moves it between calls. */
class SettableCacheNamespace extends CacheNamespace {
  name = "";

  current(): string {
    return this.name;
  }
}

/** A driver over the fixture's server with key prefix `prefix`, as one instance has; closed after the file. */
const cacheOn = (
  prefix: string,
  namespace: CacheNamespace = new SharedCacheNamespaceDriver(),
): ValkeyCacheDriver =>
  valkey.track(
    new ValkeyCacheDriver(
      buildConfig(CacheConfig, {
        values: { driver: "valkey", valkey: { keyPrefix: prefix } },
        secrets: new CacheSecrets(),
      }),
      namespace,
      new SystemClockDriver(),
      new LocalCacheLockDriver(),
      new NoneCacheMetricsDriver(),
    ),
  );

/** Every key on the server under `prefix`, sorted. */
const keysUnder = async (prefix: string): Promise<readonly string[]> =>
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts the fresh array KEYS answered
  [...(await valkey.client.keys(`${prefix}*`))].sort();

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

class Product {}

class Category {}

const TEN_MINUTES = Duration.minutes(10);

describe(ValkeyCacheDriver, () => {
  it("serves a value one instance put to another", async () => {
    const key = CacheKey.of(Product, "prd_1");
    await cacheOn("a:").put(key, { id: "prd_1", price: 1250 }, TEN_MINUTES);
    await expect(cacheOn("a:").get(key)).resolves.toEqual({ id: "prd_1", price: 1250 });
  });

  it("lets the server reclaim an entry and its sets once their lifetimes pass", async () => {
    const cache = cacheOn("b:");
    const key = CacheKey.of(Product, "prd_2", "en");
    await cache.put(key, "short", Duration.parse("200ms"), { tags: [CacheKey.of(Category, "c")] });
    const written = await keysUnder("b:");
    expect(written.length).toBeGreaterThan(1);
    for (const name of written)
      // oxlint-disable-next-line no-await-in-loop -- each key's lifetime in turn
      expect(await valkey.client.pttl(name)).toBeGreaterThan(0);
    await sleep(400);
    await expect(cache.get(key)).resolves.toBeUndefined();
    expect(await keysUnder("b:")).toEqual([]);
  });

  it("extends a set for a longer member and never shortens it for a shorter one", async () => {
    const cache = cacheOn("c:");
    const tag = CacheKey.of(Category, "cat_c");
    await cache.put(CacheKey.of(Product, "prd_first"), 1, Duration.seconds(2), { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_long"), 2, Duration.minutes(5), { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_short"), 3, Duration.seconds(2), { tags: [tag] });
    const sets = (await keysUnder("c:")).filter((name) => name.startsWith("c:#"));
    expect(sets.length).toBeGreaterThan(0);
    const lifetimes = await Promise.all(sets.map((name) => valkey.client.pttl(name)));
    expect(Math.max(...lifetimes)).toBeGreaterThan(Duration.toMilliseconds(Duration.minutes(4)));
    for (const lifetime of lifetimes) expect(lifetime).toBeGreaterThan(0);
  });

  it("forgets a key and every key it covers, as another instance wrote them", async () => {
    const writer = cacheOn("d:");
    await writer.put(CacheKey.of(Product, "prd_d", "en"), "en", TEN_MINUTES);
    await writer.put(CacheKey.of(Product, "prd_d", "ar"), "ar", TEN_MINUTES);
    await writer.put(CacheKey.of(Product, "prd_other", "en"), "other", TEN_MINUTES);
    const reader = cacheOn("d:");
    await reader.forget(CacheKey.of(Product, "prd_d"));
    await expect(writer.get(CacheKey.of(Product, "prd_d", "en"))).resolves.toBeUndefined();
    await expect(writer.get(CacheKey.of(Product, "prd_d", "ar"))).resolves.toBeUndefined();
    await expect(writer.get(CacheKey.of(Product, "prd_other", "en"))).resolves.toBe("other");
  });

  it("forgets every entry of a tag, as another instance wrote them, and nothing else", async () => {
    const writer = cacheOn("e:");
    const tag = CacheKey.of(Category, "cat_e");
    await writer.put(CacheKey.of(Product, "prd_e1"), 1, TEN_MINUTES, { tags: [tag] });
    await writer.put(CacheKey.of(Product, "prd_e2"), 2, TEN_MINUTES, { tags: [tag] });
    await writer.put(CacheKey.of(Product, "prd_e3"), 3, TEN_MINUTES);
    await cacheOn("e:").forgetTag(tag);
    await expect(writer.get(CacheKey.of(Product, "prd_e1"))).resolves.toBeUndefined();
    await expect(writer.get(CacheKey.of(Product, "prd_e2"))).resolves.toBeUndefined();
    await expect(writer.get(CacheKey.of(Product, "prd_e3"))).resolves.toBe(3);
  });

  it("drops a dead member from a set that lives on, on the next add", async () => {
    const cache = cacheOn("f:");
    const tag = CacheKey.of(Category, "cat_f");
    await cache.put(CacheKey.of(Product, "prd_anchor"), 0, TEN_MINUTES, { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_gone"), 1, Duration.parse("100ms"), { tags: [tag] });
    await sleep(250);
    await cache.put(CacheKey.of(Product, "prd_kept"), 2, TEN_MINUTES, { tags: [tag] });
    const sets = (await keysUnder("f:")).filter((name) => name.startsWith("f:#"));
    const members = (
      await Promise.all(sets.map((name) => valkey.client.zrange(name, 0, -1)))
    ).flat();
    expect(members.some((member) => member.includes("prd_gone"))).toBe(false);
    expect(members.some((member) => member.includes("prd_kept"))).toBe(true);
    expect(members.some((member) => member.includes("prd_anchor"))).toBe(true);
  });

  it("serves a stale entry inside its window while one reload replaces it", async () => {
    const cache = cacheOn("g:");
    const key = CacheKey.of(Product, "prd_g");
    const options = { stale: Duration.seconds(30) };
    await cache.remember(key, Duration.parse("100ms"), () => "first", options);
    await sleep(250);
    let reloads = 0;
    const reload = async (): Promise<string> => {
      reloads += 1;
      await sleep(50);
      return "second";
    };
    const served = await Promise.all([
      cache.remember(key, TEN_MINUTES, reload, options),
      cache.remember(key, TEN_MINUTES, reload, options),
    ]);
    expect(served).toEqual(["first", "first"]);
    await sleep(200);
    expect(reloads).toBe(1);
    await expect(cacheOn("g:").get(key)).resolves.toBe("second");
  });

  it("keeps two namespaces apart on one server", async () => {
    const namespace = new SettableCacheNamespace();
    const cache = cacheOn("h:", namespace);
    const key = CacheKey.of(Product, "prd_h");
    const tag = CacheKey.of(Category, "cat_h");
    namespace.name = "scp_a";
    await cache.put(key, "a", TEN_MINUTES, { tags: [tag] });
    namespace.name = "scp_ab";
    await cache.put(key, "ab", TEN_MINUTES, { tags: [tag] });
    await expect(cache.get(key)).resolves.toBe("ab");
    namespace.name = "";
    await expect(cache.get(key)).resolves.toBeUndefined();
    namespace.name = "scp_a";
    await cache.forgetTag(tag);
    await expect(cache.get(key)).resolves.toBeUndefined();
    namespace.name = "scp_ab";
    await expect(cache.get(key)).resolves.toBe("ab");
  });
});
