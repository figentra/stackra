/**
 * Stackra file contract:
 * Purpose: unit tests of `registerExtensions`: rows are stored once each, and a row whose point, slot or class is not
 *          what it should be is refused.
 * Boundary: test only; reads the internal registry to observe the write.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 22 to 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { Extension } from "#core/bases/extension.base";
import { ExtensionPoint } from "#core/bases/extension-point.base";
import { EXTENSION_REGISTRY } from "#core/constants/extension-registry.constant";
import { registerExtensions } from "#core/functions/register-extensions.function";

class EarnPoint extends ExtensionPoint {
  readonly earnAdjust = ExtensionPoint.after<number, []>();
}

class TierMultiplierExtension extends Extension<EarnPoint["earnAdjust"]>({ order: 100 }) {
  async handle(points: number): Promise<number> {
    return points * 2;
  }
}

describe(registerExtensions, () => {
  it("stores each row once", () => {
    const row = { point: EarnPoint, slot: "earnAdjust", extension: TierMultiplierExtension };
    registerExtensions([row, row]);
    registerExtensions([row]);
    expect(EXTENSION_REGISTRY.filter((entry) => entry.point === EarnPoint)).toHaveLength(1);
  });

  it("refuses a row that is not a point, a slot and an extension", () => {
    class NotAPoint {}
    class NotAnExtension {}
    expect(() =>
      registerExtensions([
        {
          point: NotAPoint as unknown as typeof EarnPoint,
          slot: "earnAdjust",
          extension: TierMultiplierExtension,
        },
      ]),
    ).toThrow(/ExtensionPoint/);
    expect(() =>
      registerExtensions([{ point: EarnPoint, slot: "", extension: TierMultiplierExtension }]),
    ).toThrow(/slot name/);
    expect(() =>
      registerExtensions([
        {
          point: EarnPoint,
          slot: "earnAdjust",
          extension: NotAnExtension as unknown as typeof TierMultiplierExtension,
        },
      ]),
    ).toThrow(/does not extend Extension/);
  });
});
