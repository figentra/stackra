/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchIndexState`: the three states of an index, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0404 (decision 3); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SearchIndexState } from "#core/enums/search-index-state.enum";

describe("SearchIndexState", () => {
  it("lists the states of an index", () => {
    expect(Enum.values(SearchIndexState)).toEqual(["valid", "invalid", "rebuilding"]);
  });
});
