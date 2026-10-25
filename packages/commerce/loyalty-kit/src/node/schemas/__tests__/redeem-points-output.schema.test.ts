/**
 * Stackra file contract:
 * Purpose: unit tests of `RedeemPointsOutput`: a registered shape of the points debited, their worth and the balance
 *          after, none of them negative.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { RedeemPointsOutput } from "#node/schemas/redeem-points-output.schema";

describe("RedeemPointsOutput", () => {
  const valid = { points: 300, amountMinor: 300, balance: 700 };

  it("holds the points debited, their worth and the balance after", () => {
    expect({ ...RedeemPointsOutput.create(valid) }).toEqual(valid);
  });

  it("refuses a negative value", () => {
    expect(() => RedeemPointsOutput.create({ ...valid, balance: -1 })).toThrow();
  });
});
