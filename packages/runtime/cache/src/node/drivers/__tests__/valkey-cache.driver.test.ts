/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyCacheDriver`: it is the `Cache` port, it refuses to start without the
 *          `CACHE_VALKEY_URL` secret, it connects to that URL with one retry per command, it writes each entry under
 *          the key prefix with `PX` milliseconds, reads it back until the lifetime passes on the clock, and `forget`
 *          walks every `SCAN` page with the prefix's glob characters escaped, dropping only the covered keys.
 * Boundary: test only; `iovalkey` is mocked by an in-memory client, so no server runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4); ADR 0173 (secrets by name).
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { ValkeyCacheDriver } from "#node/drivers/valkey-cache.driver";

/** The in-memory server the mocked client talks to, and what the client was built with. */
const server = vi.hoisted(() => ({
  values: new Map<string, string>(),
  options: [] as unknown[],
  patterns: [] as string[],
}));

/** A glob of `MATCH` as a regular expression: a backslash makes the next character literal, `*` is anything. */
const matcher = vi.hoisted(() => (glob: string): RegExp => {
  let source = "";
  for (let index = 0; index < glob.length; index += 1) {
    let char = glob.charAt(index);
    if (char === "*") {
      source += ".*";
      continue;
    }
    if (char === "\\") {
      index += 1;
      char = glob.charAt(index);
    }
    source += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
});

vi.mock("iovalkey", () => ({
  default: class {
    get = vi.fn(async (key: string) => server.values.get(key) ?? null);

    set = vi.fn(async (key: string, value: string) => {
      server.values.set(key, value);
      return "OK";
    });

    del = vi.fn(async (key: string) => (server.values.delete(key) ? 1 : 0));

    // One key per page, so the driver must follow the cursor.
    scan = vi.fn(async (cursor: string, _match: string, pattern: string) => {
      server.patterns.push(pattern);
      const keys = [...server.values.keys()].filter((key) => matcher(pattern).test(key));
      const index = Number(cursor);
      const next = index + 1 >= keys.length ? "0" : String(index + 1);
      return [next, keys.slice(index, index + 1)];
    });

    constructor(...args: unknown[]) {
      server.options.push(args);
    }
  },
}));

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

/** A secret store holding only `CACHE_VALKEY_URL`. */
class ValkeySecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "CACHE_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

class Product {}

const TEN_MINUTES = Duration.minutes(10);

/** A driver over a fresh server, with the prefix `keyPrefix`. */
function setup(keyPrefix = "commerce:"): { cache: ValkeyCacheDriver; clock: ManualClock } {
  server.values.clear();
  server.options.length = 0;
  server.patterns.length = 0;
  const clock = new ManualClock();
  const config = buildConfig(CacheConfig, {
    values: { driver: "valkey", valkey: { keyPrefix } },
    secrets: new ValkeySecrets(),
  });
  return { cache: new ValkeyCacheDriver(config, new SharedCacheNamespaceDriver(), clock), clock };
}

describe("ValkeyCacheDriver", () => {
  it("is a driver of the Cache port, connected to the secret URL with one retry per command", () => {
    expect(setup().cache).toBeInstanceOf(Cache);
    expect(server.options).toEqual([["redis://:pw@valkey.test:6379", { maxRetriesPerRequest: 1 }]]);
  });

  it("refuses to start without the CACHE_VALKEY_URL secret", () => {
    const config = buildConfig(CacheConfig, { values: { driver: "valkey" } });
    expect(
      () => new ValkeyCacheDriver(config, new SharedCacheNamespaceDriver(), new ManualClock()),
    ).toThrow(/CACHE_VALKEY_URL/);
  });

  it("writes under the key prefix with PX milliseconds and reads back until the lifetime passes", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, { id: "prd_1" }, TEN_MINUTES);
    expect(cache.client.set).toHaveBeenCalledWith(
      "commerce:/Product:prd_1",
      expect.any(String),
      "PX",
      600_000,
    );
    await expect(cache.get(key)).resolves.toEqual({ id: "prd_1" });
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("forgets every covered key across SCAN pages, matching the prefix literally", async () => {
    const { cache } = setup("app*[1]:");
    await cache.put(CacheKey.of(Product, "prd_1"), "base", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "ar"), "ar", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10"), "other", TEN_MINUTES);
    server.values.set("appX1:/Product:prd_1", "a lookalike under another prefix");
    await cache.forget(CacheKey.of(Product, "prd_1"));
    expect(server.patterns[0]).toBe("app\\*\\[1\\]:/Product:prd_1*");
    expect([...server.values.keys()].sort()).toEqual([
      "app*[1]:/Product:prd_10",
      "appX1:/Product:prd_1",
    ]);
  });
});
