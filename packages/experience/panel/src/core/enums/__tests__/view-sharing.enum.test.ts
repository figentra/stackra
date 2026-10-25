/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ViewSharing`: private and scope, codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ViewSharing } from "#core/enums/view-sharing.enum";

describe("ViewSharing", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ViewSharing)).toEqual(["private", "scope"]);
  });

  it("types its values", () => {
    expectTypeOf<ViewSharing>().toEqualTypeOf<"private" | "scope">();
  });
});
