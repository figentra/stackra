/**
 * Stackra file contract:
 * Purpose: unit tests of `ChargeInitiator`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";

describe("ChargeInitiator", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(ChargeInitiator)).toEqual(["customer", "merchant"]);
  });
});
