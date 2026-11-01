/**
 * Stackra file contract:
 * Purpose: proves `cache:clear` empties the cache with `--force` or after a yes, keeps it on a no, and exits 2 naming
 *          `--force` when the run cannot ask; and that `flush` of a `MemoryCacheDriver` drops its entries.
 * Boundary: test only; runs through `runCommandForTest` over a `MemoryCacheDriver`.
 * Runtime: node (vitest)
 * Governing contract: STA-1731 spec FR-012 and FR-013; ADR 0022 (test placement).
 */
// @covers sta-1731:FR-012 sta-1731:FR-013
import { buildConfig } from "@stackra/config";
import { runCommandForTest } from "@stackra/console/testing";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CacheConfig } from "#config/cache.config";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { MemoryCacheDriver } from "#core/drivers/memory-cache.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { CacheClearCommand } from "#node/commands/cache-clear.command";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00.000Z");
  }
}

class RootNamespace extends CacheNamespace {
  current(): string {
    return "";
  }
}

class Product {}

/** A memory cache holding one entry, and the container that serves it to the command. */
async function setup() {
  const cache = new MemoryCacheDriver(
    buildConfig(CacheConfig, { values: {} }),
    new RootNamespace(),
    new FixedClock(),
    new NoneCacheMetricsDriver(),
  );
  const key = CacheKey.of(Product, "prd_1");
  await cache.put(key, "value", Duration.minutes(10));
  const container = () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
      Reflect.construct(type, [cache]) as T,
    close: async () => {},
  });
  return { cache, key, container };
}

describe(CacheClearCommand, () => {
  it("clears the cache with --force", async () => {
    const { cache, key, container } = await setup();
    const result = await runCommandForTest(
      [CacheClearCommand],
      ["cache:clear", "--force", "--json"],
      { container },
    );
    expect(result.exitCode).toBe(0);
    expect(result.json).toEqual({ ok: true, data: { cleared: true } });
    expect(await cache.get(key)).toBeUndefined();
  });

  it("exits 2 naming --force when the run cannot ask, and keeps the entry", async () => {
    const { cache, key, container } = await setup();
    const result = await runCommandForTest([CacheClearCommand], ["cache:clear"], { container });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("--force");
    expect(await cache.get(key)).toBe("value");
  });

  it("clears after a yes", async () => {
    const { cache, key, container } = await setup();
    const result = await runCommandForTest([CacheClearCommand], ["cache:clear"], {
      container,
      answers: [true],
    });
    expect(result.exitCode).toBe(0);
    expect(result.asked).toHaveLength(1);
    expect(await cache.get(key)).toBeUndefined();
  });

  it("keeps the entry after a no", async () => {
    const { cache, key, container } = await setup();
    const result = await runCommandForTest([CacheClearCommand], ["cache:clear"], {
      container,
      answers: [false],
    });
    expect(result.exitCode).toBe(0);
    expect(await cache.get(key)).toBe("value");
  });
});
