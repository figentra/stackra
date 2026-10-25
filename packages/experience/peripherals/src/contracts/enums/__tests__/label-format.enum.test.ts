/**
 * Stackra file contract:
 * Purpose: unit tests of `LabelFormat`: the two forms of a label.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decisions 1 and 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat } from "#contracts/enums/label-format.enum";

describe("LabelFormat", () => {
  it("is zpl or raster", () => {
    expect(Enum.values(LabelFormat)).toEqual(["zpl", "raster"]);
  });
});
