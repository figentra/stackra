/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `SearchDriver`, which the template's commerce wiring
 *          imports (`port: SearchDriver`), is the only value, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  SearchDocument,
  SearchFilterValue,
  SearchRequest,
  SearchTable,
} from "#contracts/index";

describe("@stackra/search/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["SearchDriver"]);
  });

  it("resolves its public types", () => {
    expectTypeOf<SearchFilterValue>().toEqualTypeOf<string | number | boolean>();
    expectTypeOf<SearchDocument["id"]>().toEqualTypeOf<string>();
    expectTypeOf<SearchRequest["words"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SearchTable["schema"]>().toEqualTypeOf<string | undefined>();
  });
});
