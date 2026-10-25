/**
 * Stackra file contract:
 * Purpose: unit tests of `PriceKind`: the three snake_case codes of an item price.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PriceKind } from "#core/enums/price-kind.enum";

describe("PriceKind", () => {
  it("has the three kinds", () => {
    expect(Enum.values(PriceKind)).toEqual(["fixed", "graduated", "formula"]);
  });
});
