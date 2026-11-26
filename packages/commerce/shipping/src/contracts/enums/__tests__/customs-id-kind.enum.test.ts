/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomsIdKind`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231; ADR 0369.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CustomsIdKind } from "#contracts/enums/customs-id-kind.enum";

describe("CustomsIdKind", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(CustomsIdKind)).toEqual(["eori", "ioss", "ein", "vat"]);
  });
});
