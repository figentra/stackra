/**
 * Stackra file contract:
 * Purpose: unit tests of `PerkListing`: the shipped schema is registered, defaults apply, and each redemption kind needs its own field.
 * Boundary: test only; listings and fee schedules are test data standing in for OS admin records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1); owner M3-7.
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { PERK_LISTING_SCHEMA } from "#core/constants/perk-listing-schema.constant";
import { PerkListing } from "#core/schemas/perk-listing.schema";

import { PERK } from "#core/__tests__/perk-fixtures";

describe("PerkListing", () => {
  it("registers the shipped schema and fills the defaults", () => {
    expect(schemaOf(PerkListing)).toBe(PERK_LISTING_SCHEMA);
    const result = validate(PerkListing, { ...PERK, feeSchedule: undefined });
    expect(result.success).toBe(true);
    if (result.success)
      expect([result.data.url, result.data.leadFields, result.data.feeSchedule]).toEqual([
        null,
        [],
        null,
      ]);
  });

  it("asks each redemption kind for its field", () => {
    expect(validate(PerkListing, { ...PERK, code: null }).success).toBe(false);
    expect(validate(PerkListing, { ...PERK, redemption: "link" }).success).toBe(false);
    expect(
      validate(PerkListing, { ...PERK, redemption: "link", url: "https://partner.example/go" })
        .success,
    ).toBe(true);
    expect(validate(PerkListing, { ...PERK, redemption: "lead" }).success).toBe(false);
    expect(
      validate(PerkListing, { ...PERK, redemption: "lead", leadFields: ["company"] }).success,
    ).toBe(true);
  });

  it("refuses empty or repeated lists, plain-http links and unknown states", () => {
    expect(validate(PerkListing, { ...PERK, packs: [] }).success).toBe(false);
    expect(validate(PerkListing, { ...PERK, products: ["commerce", "commerce"] }).success).toBe(
      false,
    );
    expect(
      validate(PerkListing, { ...PERK, termsUrl: "http://partner.example/terms" }).success,
    ).toBe(false);
    expect(validate(PerkListing, { ...PERK, state: "live" }).success).toBe(false);
  });
});
