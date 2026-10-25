/**
 * Stackra file contract:
 * Purpose: unit tests of `ConfirmRedemptionInput`: a registered shape of the reference to confirm, refusing an empty
 *          or overlong one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0136.
 */
import { describe, expect, it } from "@stackra/testing";

import { ConfirmRedemptionInput } from "#node/schemas/confirm-redemption-input.schema";

describe("ConfirmRedemptionInput", () => {
  it("holds the reference to confirm", () => {
    expect({ ...ConfirmRedemptionInput.create({ reference: "ord_2" }) }).toEqual({
      reference: "ord_2",
    });
  });

  it("refuses an empty or overlong reference", () => {
    expect(() => ConfirmRedemptionInput.create({ reference: "" })).toThrow();
    expect(() => ConfirmRedemptionInput.create({ reference: "x".repeat(121) })).toThrow();
  });
});
