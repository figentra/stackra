/**
 * Stackra file contract:
 * Purpose: unit tests of `LabelFormat`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231; ADR 0369.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat } from "#contracts/enums/label-format.enum";

describe("LabelFormat", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(LabelFormat)).toEqual(["pdf", "zpl"]);
  });
});
