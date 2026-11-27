/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyCacheDriver` on a real Valkey server: two drivers (two instances of a member)
 *          share what one stores, `forget` and `forgetTag` reach across them, the server expires an entry on its own
 *          `PX`, and `add` is atomic on the server: of concurrent adds of one key from both instances exactly one
 *          wins, and the key is free again once its lifetime passes.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the image is pinned. The URL is the container's
 *           mapped port with no password, built here, never a secret value.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0437 (Enforcement: the shared nonce store is `Cache.add`);
 *                     ADR 0182; ADR 0022; ADR 0269.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { SystemClockDriver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer, Wait } from "testcontainers";

import { CacheConfig } from "#config/cache.config";
import { CacheKey } from "#core/constants/cache-key.constant";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { ValkeyCacheDriver } from "#node/drivers/valkey-cache.driver";

/** The Valkey image the drivers are proven against. */
const IMAGE = "valkey/valkey:8.1";

/** How long pulling and starting the container may take. */
const BOOT_TIMEOUT_MS = 120_000;

const state: { container?: StartedTestContainer; drivers: ValkeyCacheDriver[] } = { drivers: [] };

/** A secret store holding only the container's URL. */
class ContainerSecrets extends SecretStore {
  private readonly url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  get(name: string): string | undefined {
    return name === "CACHE_VALKEY_URL" ? this.url : undefined;
  }
}

/** One more driver (one more instance of the member) on the container, under `keyPrefix`. */
function instance(keyPrefix = "it:"): ValkeyCacheDriver {
  const { container } = state;
  if (container === undefined) throw new Error("the Valkey container did not start");
  const config = buildConfig(CacheConfig, {
    values: { driver: "valkey", valkey: { keyPrefix } },
    secrets: new ContainerSecrets(
      `redis://${container.getHost()}:${container.getMappedPort(6379)}`,
    ),
  });
  const driver = new ValkeyCacheDriver(
    config,
    new SharedCacheNamespaceDriver(),
    new SystemClockDriver(),
    new LocalCacheLockDriver(),
    new NoneCacheMetricsDriver(),
  );
  state.drivers.push(driver);
  return driver;
}

beforeAll(async () => {
  state.container = await new GenericContainer(IMAGE)
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .start();
}, BOOT_TIMEOUT_MS);

afterAll(async () => {
  await Promise.all(state.drivers.map((driver) => driver.client.quit()));
  await state.container?.stop();
});

class Product {}

class Category {}

const TEN_MINUTES = Duration.minutes(10);

describe("ValkeyCacheDriver on a real server", () => {
  it("shares entries between instances; forget and forgetTag reach across them", async () => {
    const one = instance();
    const two = instance();
    const tag = CacheKey.of(Category, "cat_1");
    await one.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES, { tags: [tag] });
    await one.put(CacheKey.of(Product, "prd_2"), "two", TEN_MINUTES);
    await expect(two.get(CacheKey.of(Product, "prd_1", "en"))).resolves.toBe("en");
    await two.forgetTag(tag);
    await expect(one.get(CacheKey.of(Product, "prd_1", "en"))).resolves.toBeUndefined();
    await two.forget(CacheKey.of(Product));
    await expect(one.get(CacheKey.of(Product, "prd_2"))).resolves.toBeUndefined();
  });

  it("lets the server expire an entry on its own PX", async () => {
    const cache = instance();
    const key = CacheKey.of(Product, "prd_3");
    await cache.put(key, 1, Duration.parse("300ms"));
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await expect(cache.client.exists(`it:/${key}`)).resolves.toBe(0);
  });

  it("adds atomically across instances: of concurrent adds of one key exactly one wins", async () => {
    const one = instance();
    const two = instance();
    for (let round = 0; round < 20; round += 1) {
      const key = CacheKey.of(Product, "req", round);
      // oxlint-disable-next-line no-await-in-loop -- each round races its own adds; rounds run one after another
      const answers = await Promise.all(
        [one, two, one, two, one, two].map((cache, n) => cache.add(key, n, TEN_MINUTES)),
      );
      expect(answers.filter(Boolean)).toHaveLength(1);
    }
  });

  it("frees an added key once its lifetime passes on the server", async () => {
    const one = instance();
    const two = instance();
    const key = CacheKey.of(Product, "req-ttl");
    await expect(one.add(key, true, Duration.parse("300ms"))).resolves.toBe(true);
    await expect(two.add(key, true, Duration.parse("300ms"))).resolves.toBe(false);
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await expect(two.add(key, true, Duration.parse("300ms"))).resolves.toBe(true);
  });
});
