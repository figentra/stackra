/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalChannel`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";

describe("FiscalChannel", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(FiscalChannel)).toEqual(["invoice", "till"]);
  });
});
