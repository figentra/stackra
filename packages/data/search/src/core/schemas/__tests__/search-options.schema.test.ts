/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SearchOptions`: a shape whose initializer equals the shipped schema's default,
 *          registered with that schema, with `driver` typed as the `SearchDriver` driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 4 and
 *                     26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";
import { SearchOptions } from "#core/schemas/search-options.schema";

describe("SearchOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new SearchOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(SearchOptions)).toBe(SEARCH_CONFIG_SCHEMA);
  });

  it("has an initializer equal to the shipped default", () => {
    expect({ ...new SearchOptions() }).toEqual(SEARCH_CONFIG_SCHEMA.parse({}));
  });

  it("types driver as the SearchDriver driver names", () => {
    expectTypeOf<SearchOptions["driver"]>().toEqualTypeOf<"postgres" | "memory">();
  });
});
