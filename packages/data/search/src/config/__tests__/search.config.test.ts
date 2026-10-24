/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SearchConfig`: a configuration over `SearchOptions` keyed `search` (the key the
 *          template's wiring selects the driver by, `config:search.driver`), built with its default, the template's
 *          runway value and a host override, and refusing a driver no one ships.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19 and
 *                     20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SearchConfig } from "#config/search.config";
import type { SearchDriver } from "#contracts/ports/search-driver.port";
import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseSearchConfig = SearchConfig;

class HostSearchConfig extends BaseSearchConfig {
  override driver: DriverName<SearchDriver> = "memory";
}

describe("SearchConfig", () => {
  it("is a configuration keyed search, an override inheriting the key", () => {
    expect(new SearchConfig()).toBeInstanceOf(Config);
    expect(configKey(SearchConfig, "search")).toBe("search");
    expect(configKey(HostSearchConfig, "search")).toBe("search");
  });

  it("types its field on the class and builds with the default", () => {
    const config = buildConfig(SearchConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<SearchDriver>>();
    expect({ ...config }).toEqual(SEARCH_CONFIG_SCHEMA.parse({}));
    expect(config.driver).toBe("postgres");
  });

  it("takes the template's dev runway value and a host override", () => {
    expect(buildConfig(SearchConfig, { values: { driver: "memory" } }).driver).toBe("memory");
    expect(buildConfig(HostSearchConfig).driver).toBe("memory");
  });

  it("refuses a driver no one ships", () => {
    expect(() =>
      buildConfig(SearchConfig, {
        values: { driver: "opensearch" as DriverName<SearchDriver> },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
