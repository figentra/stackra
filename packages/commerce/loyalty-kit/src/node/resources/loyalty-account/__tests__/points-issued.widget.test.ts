/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsIssuedWidget`: a small tile on the dashboard's main grid for owners and managers,
 *          drawn by the kit's own renderer.
 * Boundary: test only; reads the tree `describeWidget` builds, as gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 14 to 19); ADR 0273.
 */
import { SystemRole } from "@stackra/iam";
import { DisplayKind, Place, WidgetSize, describeWidget } from "@stackra/panel";
import { describe, expect, it } from "@stackra/testing";

import { PointsIssuedWidget } from "#node/resources/loyalty-account/points-issued.widget";

describe("PointsIssuedWidget", () => {
  it("is a small tile on the dashboard's main grid for owners and managers", () => {
    expect(describeWidget(PointsIssuedWidget).options).toEqual({
      slot: { key: "dashboard.main", place: Place.Grid },
      size: WidgetSize.Small,
      roles: [SystemRole.Owner, SystemRole.Manager],
    });
  });

  it("is drawn by the kit's own renderer", () => {
    expect(describeWidget(PointsIssuedWidget).display.kind).toBe(DisplayKind.Custom);
  });
});
