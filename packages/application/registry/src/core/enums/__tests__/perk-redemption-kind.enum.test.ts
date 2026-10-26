/**
 * Stackra file contract:
 * Purpose: unit tests of `PerkRedemptionKind`: code, link and lead.
 * Boundary: test only; listings and fee schedules are test data standing in for OS admin records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1); owner M3-7.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PerkRedemptionKind } from "#core/enums/perk-redemption-kind.enum";

describe("PerkRedemptionKind", () => {
  it("has code, link and lead", () => {
    expect(Enum.values(PerkRedemptionKind)).toEqual(["code", "link", "lead"]);
  });
});
