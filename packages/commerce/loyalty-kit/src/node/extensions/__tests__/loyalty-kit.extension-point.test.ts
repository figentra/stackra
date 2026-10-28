/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitExtensionPoint`: an extension point with an `after` slot `earnAdjust` and a
 *          `before` slot `redeemVerify`, which pass the value and arguments through when no extension is connected.
 * Boundary: test only; the point is constructed directly, with no extension registered.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rules 22 to 25).
 */
import { ExtensionPoint } from "@stackra/actions";
import { fakeExtensionContext } from "@stackra/actions/testing";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyKitExtensionPoint } from "#node/extensions/loyalty-kit.extension-point";
import { RedeemPointsInput } from "#node/schemas/redeem-points-input.schema";

describe("LoyaltyKitExtensionPoint", () => {
  const point = new LoyaltyKitExtensionPoint();
  const ctx = fakeExtensionContext();

  it("is an extension point whose slots are callable properties", () => {
    expect(point).toBeInstanceOf(ExtensionPoint);
    expect(typeof point.earnAdjust).toBe("function");
    expect(typeof point.redeemVerify).toBe("function");
  });

  it("passes the value and the arguments through when no extension is connected", async () => {
    const draft = {
      memberId: memberId("usr_1"),
      tier: LoyaltyTier.Bronze,
      amount: { minor: 10_000, currency: "SAR" },
    };
    expect(await point.earnAdjust(100, draft, ctx)).toBe(100);
    const input = RedeemPointsInput.create({ points: 300, reference: "ord_2", totalMinor: 10_000 });
    expect(await point.redeemVerify(input, ctx)).toEqual([input]);
  });
});
