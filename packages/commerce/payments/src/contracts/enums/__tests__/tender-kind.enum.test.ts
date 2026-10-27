/**
 * Stackra file contract:
 * Purpose: unit tests of `TenderKind`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0445.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenderKind } from "#contracts/enums/tender-kind.enum";

describe("TenderKind", () => {
  it("has its codes in order", () => {
    expect(Enum.values(TenderKind)).toEqual(["card", "restricted"]);
  });
});
