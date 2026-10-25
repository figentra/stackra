/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsBalanceWidget`: an unplaced medium tile over the balance query, bound to the signed-in
 *          member's account, drawn by the kit's own renderer.
 * Boundary: test only; reads the tree `describeWidget` builds, as gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 14 to 19).
 */
import { DisplayKind, PlacementLayer, WidgetSize, describeWidget } from "@stackra/panel";
import { describe, expect, it } from "@stackra/testing";

import { PointsBalanceWidget } from "#node/resources/loyalty-account/points-balance.widget";

describe("PointsBalanceWidget", () => {
  it("is an unplaced medium tile bound to the member's own account", () => {
    const tree = describeWidget(PointsBalanceWidget);
    expect(tree.layer).toBe(PlacementLayer.Owner);
    expect(tree.options).toEqual({
      params: { accountId: "actor.accountId" },
      size: WidgetSize.Medium,
    });
    expect(tree.options.slot).toBeUndefined();
  });

  it("is drawn by the kit's own renderer", () => {
    expect(describeWidget(PointsBalanceWidget).display.kind).toBe(DisplayKind.Custom);
  });
});
