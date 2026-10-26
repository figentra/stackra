/**
 * Stackra file contract:
 * Purpose: unit tests of `perkEligible`: only an approved listing in the tenant's pack and product is shown.
 * Boundary: test only; listings and fee schedules are test data standing in for OS admin records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1); owner M3-7.
 */
import { describe, expect, it } from "@stackra/testing";

import { perkEligible } from "#core/functions/perk-eligible.function";

import { PERK } from "#core/__tests__/perk-fixtures";

const listing = { ...PERK, packs: [...PERK.packs], products: [...PERK.products] };

describe("perkEligible", () => {
  it("shows an approved listing in its packs and products", () => {
    expect(perkEligible(listing, "eg", "commerce")).toBe(true);
  });

  it("hides it elsewhere or before approval", () => {
    expect(perkEligible(listing, "us", "commerce")).toBe(false);
    expect(perkEligible(listing, "eg", "juristra")).toBe(false);
    expect(perkEligible({ ...listing, state: "submitted" }, "eg", "commerce")).toBe(false);
  });
});
