/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPacksConfig`: a configuration keyed `market_packs` that builds with the shipped
 *          defaults, reads the source driver from `STACKRA_MARKET_PACKS_SOURCE`, takes a host override, and refuses an
 *          unknown driver.
 * Boundary: test only; pure configuration building, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0146 as amended; ADR 0294 (decision 19); ADR 0418.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MarketPacksConfig } from "#config/market-packs.config";
import { MARKET_PACKS_CONFIG_SCHEMA } from "#core/constants/market-packs-config-schema.constant";
import type { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";

/** A host override, under the plain name with the package class aliased. */
const BaseMarketPacksConfig = MarketPacksConfig;

class HostMarketPacksConfig extends BaseMarketPacksConfig {
  override packHashes = ["b".repeat(64)];
}

describe("MarketPacksConfig", () => {
  it("is a configuration keyed market_packs", () => {
    expect(new MarketPacksConfig()).toBeInstanceOf(Config);
    expect(configKey(MarketPacksConfig, "market_packs")).toBe("market_packs");
  });

  it("types its fields and builds with the defaults", () => {
    const config = buildConfig(MarketPacksConfig);
    expectTypeOf(config.source).toEqualTypeOf<DriverName<ResolvedPackSource>>();
    expect({ ...config }).toEqual(MARKET_PACKS_CONFIG_SCHEMA.parse({}));
  });

  it("reads the source from the environment and takes a host override", () => {
    expect(
      buildConfig(MarketPacksConfig, { env: { STACKRA_MARKET_PACKS_SOURCE: "memory" } }).source,
    ).toBe("memory");
    expect(buildConfig(HostMarketPacksConfig).packHashes).toEqual(["b".repeat(64)]);
  });

  it("refuses a driver no one ships", () => {
    expect(() =>
      buildConfig(MarketPacksConfig, {
        values: { source: "redis" as DriverName<ResolvedPackSource> },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
