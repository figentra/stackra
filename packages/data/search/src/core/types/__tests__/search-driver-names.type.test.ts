/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entry: `DriverName<SearchDriver>` is exactly this package's driver
 *          names, which equal the shipped schema's `driver` enum.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import "#core/types/search-driver-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { SearchDriver } from "#contracts/ports/search-driver.port";
import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";
import { SEARCH_DRIVERS } from "#core/constants/search-drivers.constant";

describe("DriverRegistry['search.SearchDriver']", () => {
  it("narrows DriverName<SearchDriver> to the shipped drivers", () => {
    expectTypeOf<DriverName<SearchDriver>>().toEqualTypeOf<"postgres" | "memory">();
    expectTypeOf<DriverRegistry["search.SearchDriver"]>().toEqualTypeOf<DriverName<SearchDriver>>();
  });

  it("matches the schema's driver enum", () => {
    expect(SEARCH_CONFIG_SCHEMA.shape.driver.unwrap().options).toEqual([...SEARCH_DRIVERS]);
  });
});
