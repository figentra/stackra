/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Search` (which the template's catalogue queries inject and its
 *          wiring lists), `MemorySearchDriver` (the wiring's `memory` candidate) and `MemoryVectorIndexDriver` are
 *          exported with the settings group (`SearchSettings`), the configuration, its shipped schema under the
 *          generated name `SearchConfig$`, the shape, the
 *          index value and the cursor refusal, and nothing else is a value; the option types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";
import * as search from "#core/index";
import type { SearchFacetOptions, SearchFindOptions, SearchPageOptions } from "#core/index";

describe("@stackra/search", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(search).sort()).toEqual([
      "MemorySearchDriver",
      "MemoryVectorIndexDriver",
      "Search",
      "SearchConfig",
      "SearchConfig$",
      "SearchCursorInvalidError",
      "SearchIndex",
      "SearchOptions",
      "SearchSettings",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(search.SearchConfig$).toBe(SEARCH_CONFIG_SCHEMA);
  });

  it("resolves the option types", () => {
    expectTypeOf<SearchFindOptions<{ variants: unknown }>["populate"]>().toEqualTypeOf<
      readonly "variants"[] | undefined
    >();
    expectTypeOf<SearchPageOptions<object>["cursor"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SearchFacetOptions["paths"]>().toEqualTypeOf<readonly string[]>();
  });
});
