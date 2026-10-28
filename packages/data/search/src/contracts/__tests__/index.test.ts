/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `SearchDriver`, which the template's commerce wiring
 *          imports (`port: SearchDriver`), and the `VectorIndex` and `Embedder` ports @stackra/ai uses are the values,
 *          and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  SearchBoost,
  SearchDocument,
  SearchFacetRequest,
  SearchFacets,
  SearchFilterValue,
  SearchNeighbours,
  SearchQueryEntry,
  SearchRange,
  SearchRecency,
  SearchRequest,
  SearchSort,
  SearchTable,
  VectorHit,
  VectorItem,
  VectorQueryOptions,
} from "#contracts/index";

describe("@stackra/search/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "Embedder",
      "SearchDriver",
      "SearchQueryLog",
      "VectorIndex",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<SearchFilterValue>().toEqualTypeOf<string | number | boolean>();
    expectTypeOf<SearchDocument["id"]>().toEqualTypeOf<string>();
    expectTypeOf<SearchRequest["words"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SearchRange["gte"]>().toEqualTypeOf<number | string | undefined>();
    expectTypeOf<SearchSort["direction"]>().toEqualTypeOf<"asc" | "desc" | undefined>();
    expectTypeOf<SearchBoost["factor"]>().toEqualTypeOf<number>();
    expectTypeOf<SearchRecency["halfLifeDays"]>().toEqualTypeOf<number>();
    expectTypeOf<SearchNeighbours[string]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SearchQueryEntry["phrase"]>().toEqualTypeOf<string | null>();
    expectTypeOf<SearchDocument["weights"]>().toEqualTypeOf<readonly number[] | undefined>();
    expectTypeOf<SearchFacetRequest["paths"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SearchFacets[string][string]>().toEqualTypeOf<number>();
    expectTypeOf<SearchTable["schema"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<VectorItem["vector"]>().toEqualTypeOf<readonly number[]>();
    expectTypeOf<VectorHit["score"]>().toEqualTypeOf<number>();
    expectTypeOf<VectorQueryOptions["topK"]>().toEqualTypeOf<number>();
  });
});
