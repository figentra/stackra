/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyOverviewDocument`: the app-area dashboard at `/loyalty`, listed under Loyalty with the
 *          star icon, holding the points-balance tile.
 * Boundary: test only; reads the recorded options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 20); ADR 0110.
 */
import { kindOf } from "@stackra/container";
import { ApiArea } from "@stackra/contracts";
import { ExperienceKind } from "@stackra/experience/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyOverviewDocument } from "#node/resources/loyalty-account/loyalty-overview.document";
import { PointsBalanceWidget } from "#node/resources/loyalty-account/points-balance.widget";

describe("LoyaltyOverviewDocument", () => {
  it("is the app-area dashboard at /loyalty holding the points-balance tile", () => {
    expect(kindOf(LoyaltyOverviewDocument)?.kind).toBe("document");
    expect(kindOf(LoyaltyOverviewDocument)?.options).toEqual({
      kind: ExperienceKind.Dashboard,
      path: "/loyalty",
      area: ApiArea.App,
      navigation: { group: "loyalty_kit::nav.loyalty", icon: "star", order: 10 },
      blocks: [{ kind: "widget", widget: PointsBalanceWidget }],
    });
  });
});
