/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CacheConfig`: a configuration over `CacheOptions` keyed `cache.cache`, built with
 *          its defaults, a host override and a runway values layer, and refusing an invalid bound.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19, 20
 *                     and 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CacheConfig } from "#config/cache.config";
import { CACHE_CONFIG_SCHEMA } from "#core/constants/cache-config-schema.constant";

/** A host's override, under the plain name with the package class aliased. */
const BaseCacheConfig = CacheConfig;

class HostCacheConfig extends BaseCacheConfig {
  override maxEntries = 50_000;
}

describe("CacheConfig", () => {
  it("is a configuration keyed cache.cache, an override inheriting the key", () => {
    expect(new CacheConfig()).toBeInstanceOf(Config);
    expect(configKey(CacheConfig, "cache")).toBe("cache.cache");
    expect(configKey(HostCacheConfig, "cache")).toBe("cache.cache");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(CacheConfig);
    expectTypeOf(config.maxEntries).toEqualTypeOf<number>();
    expect({ ...config }).toEqual(CACHE_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies an override and a runway values layer", () => {
    expect(buildConfig(HostCacheConfig).maxEntries).toBe(50_000);
    expect(buildConfig(CacheConfig, { values: { maxEntries: 500 } }).maxEntries).toBe(500);
  });

  it("refuses an invalid bound", () => {
    expect(() => buildConfig(CacheConfig, { values: { maxEntries: 0 } })).toThrow(
      ConfigInvalidError,
    );
  });
});
