/**
 * Stackra file contract:
 * Purpose: unit test of `Risk`: the five levels of ADR 0099 with the codes the generated clients and manifests carry
 *          (`l0` to `l4`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0099 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Risk } from "#core/enums/risk.enum";

describe("Risk", () => {
  it("holds L0 to L4 in order", () => {
    expect(Enum.values(Risk)).toEqual(["l0", "l1", "l2", "l3", "l4"]);
    expect(Risk.L3).toBe("l3");
  });
});
