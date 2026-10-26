/**
 * Stackra file contract:
 * Purpose: unit tests of `perkListingFee`: the flat fee of the listing's schedule in force on the period start is charged to the partner; a free listing charges nothing; a missing schedule is refused.
 * Boundary: test only; listings and fee schedules are test data standing in for OS admin records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1); owner M3-7.
 */
import { describe, expect, it } from "@stackra/testing";

import { perkListingFee } from "#core/functions/perk-listing-fee.function";

const LISTING = { key: "perk-shipping", partner: "dev_1", feeSchedule: "perk-listing" };
const SCHEDULES = [
  { key: "perk-listing", currency: "AED", fixedMinor: 40_000, effectiveFrom: "2026-01-01" },
  { key: "perk-listing", currency: "AED", fixedMinor: 50_000, effectiveFrom: "2026-11-01" },
  { key: "partner-standard", currency: "AED", fixedMinor: 0, effectiveFrom: "2026-01-01" },
];

describe("perkListingFee", () => {
  it("charges the schedule in force on the period start", () => {
    expect(perkListingFee(LISTING, SCHEDULES, "2026-10-01")?.amountMinor).toBe(40_000);
    expect(perkListingFee(LISTING, SCHEDULES, "2026-11-01")).toEqual({
      partner: "dev_1",
      listing: "perk-shipping",
      feeSchedule: "perk-listing",
      currency: "AED",
      amountMinor: 50_000,
    });
  });

  it("charges nothing for a free listing and refuses a schedule not yet in force", () => {
    expect(perkListingFee({ ...LISTING, feeSchedule: null }, SCHEDULES, "2026-11-01")).toBeNull();
    expect(() => perkListingFee(LISTING, SCHEDULES, "2025-12-01")).toThrow(
      /no perk-listing fee schedule/,
    );
  });
});
