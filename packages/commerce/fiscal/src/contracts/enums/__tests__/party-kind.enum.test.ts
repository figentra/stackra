/**
 * Stackra file contract:
 * Purpose: unit tests of `PartyKind`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PartyKind } from "#contracts/enums/party-kind.enum";

describe("PartyKind", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(PartyKind)).toEqual(["business", "person", "foreign"]);
  });
});
