/**
 * Stackra file contract:
 * Purpose: unit tests of `SEARCH_CONFIG_SCHEMA`: the full default from `{}`, the driver names closed to the shipped
 *          drivers, and the generated host form `Base$.extend(...)`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";

describe("SEARCH_CONFIG_SCHEMA", () => {
  it("parses {} to the default", () => {
    expect(SEARCH_CONFIG_SCHEMA.parse({})).toEqual({ driver: "postgres" });
  });

  it("takes the shipped drivers and refuses others", () => {
    expect(SEARCH_CONFIG_SCHEMA.parse({ driver: "memory" }).driver).toBe("memory");
    expect(SEARCH_CONFIG_SCHEMA.safeParse({ driver: "opensearch" }).success).toBe(false);
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = SEARCH_CONFIG_SCHEMA.extend({
      driver: SEARCH_CONFIG_SCHEMA.shape.driver.unwrap().default("memory"),
    });
    expect(Host$.parse({})).toEqual({ driver: "memory" });
  });
});
