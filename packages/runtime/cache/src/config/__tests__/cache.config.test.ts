/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CacheConfig`: a configuration over `CacheOptions` keyed `cache`, built with
 *          its defaults, a host override and a runway values layer, the Valkey URL resolved only as the
 *          `CACHE_VALKEY_URL` secret and kept off serialisation, and refusing an invalid bound or driver.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19, 20
 *                     and 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import { CACHE_CONFIG_SCHEMA } from "#core/constants/cache-config-schema.constant";

/** A host's override, under the plain name with the package class aliased. */
const BaseCacheConfig = CacheConfig;

class HostCacheConfig extends BaseCacheConfig {
  override driver: DriverName<Cache> = "valkey";

  override maxEntries = 50_000;
}

/** A secret store holding only `CACHE_VALKEY_URL`. */
class ValkeySecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "CACHE_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

describe("CacheConfig", () => {
  it("is a configuration keyed cache, an override inheriting the key", () => {
    expect(new CacheConfig()).toBeInstanceOf(Config);
    expect(configKey(CacheConfig, "cache")).toBe("cache");
    expect(configKey(HostCacheConfig, "cache")).toBe("cache");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(CacheConfig);
    expectTypeOf(config.maxEntries).toEqualTypeOf<number>();
    expectTypeOf(config.driver).toEqualTypeOf<"memory" | "storage" | "valkey" | "workers">();
    expectTypeOf(config.namespace).toEqualTypeOf<"shared" | "scope">();
    const { valkeyUrl, ...defaults } = CACHE_CONFIG_SCHEMA.parse({});
    expect({ ...config }).toEqual(defaults);
    expect(config.valkeyUrl).toBe(valkeyUrl);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies an override and a runway values layer", () => {
    expect(buildConfig(HostCacheConfig).maxEntries).toBe(50_000);
    expect(buildConfig(HostCacheConfig).driver).toBe("valkey");
    expect(buildConfig(CacheConfig, { values: { maxEntries: 500 } }).maxEntries).toBe(500);
    expect(
      buildConfig(CacheConfig, { values: { workers: { binding: "PAGE_CACHE" } } }).workers,
    ).toEqual({ binding: "PAGE_CACHE" });
  });

  it("resolves the Valkey URL from the secret store and keeps it off serialisation", () => {
    const config = buildConfig(CacheConfig, { secrets: new ValkeySecrets() });
    expect(config.valkeyUrl).toBe("redis://:pw@valkey.test:6379");
    expect(JSON.stringify(config)).not.toContain("pw@");
    expect(() =>
      buildConfig(CacheConfig, { values: { valkeyUrl: "redis://valkey.test" } }),
    ).toThrow(TypeError);
  });

  it("refuses an invalid bound or driver", () => {
    expect(() => buildConfig(CacheConfig, { values: { maxEntries: 0 } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(CacheConfig, { values: { driver: "redis" as DriverName<Cache> } }),
    ).toThrow(ConfigInvalidError);
  });
});
