/**
 * Stackra file contract:
 * Purpose: unit test of `EdiSyntax`: exactly the X12 and EDIFACT codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0447 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";

describe("EdiSyntax", () => {
  it("has exactly the two syntaxes", () => {
    expect(Enum.values(EdiSyntax)).toEqual(["x12", "edifact"]);
  });
});
