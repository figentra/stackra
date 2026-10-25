/**
 * Stackra file contract:
 * Purpose: unit tests of `ConfirmRedemptionOutput`: a registered shape of the confirmed reference.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { ConfirmRedemptionOutput } from "#node/schemas/confirm-redemption-output.schema";

describe("ConfirmRedemptionOutput", () => {
  it("holds the confirmed reference", () => {
    expect({ ...ConfirmRedemptionOutput.create({ reference: "ord_2" }) }).toEqual({
      reference: "ord_2",
    });
  });
});
