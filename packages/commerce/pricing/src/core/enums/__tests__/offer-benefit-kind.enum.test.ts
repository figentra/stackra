/**
 * Stackra file contract:
 * Purpose: unit tests of `OfferBenefitKind`: the four benefit kinds of M3-6 and their codes.
 * Boundary: test only; rows and pack values are test data standing in for seed-pack and market-pack records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OfferBenefitKind } from "#core/enums/offer-benefit-kind.enum";

describe("OfferBenefitKind", () => {
  it("has percent, credit grant, free migration and module grant", () => {
    expect(Enum.values(OfferBenefitKind)).toEqual([
      "percent",
      "credit_grant",
      "free_migration",
      "module_grant",
    ]);
  });
});
