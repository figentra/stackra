/**
 * Stackra file contract:
 * Purpose: unit tests of `offerEligible`: pack, product, rule-set answer and the per-pack cap each gate an offer.
 * Boundary: test only; rows are test data standing in for `offer:<name>` and `rate-card:<name>` seed records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 3); owner RV-52.
 */
import { describe, expect, it } from "@stackra/testing";

import { offerEligible } from "#core/functions/offer-eligible.function";

import { OFFERS } from "./offer-fixtures";

const APPLICANT = { pack: "eg", product: "commerce", ruleSetMatched: true, redeemedInPack: 0 };

describe("offerEligible", () => {
  it("passes an applicant in the pack and product whose rule set matched under the cap", () => {
    expect(offerEligible(OFFERS.startup, APPLICANT)).toBe(true);
    expect(
      offerEligible(OFFERS.annual, { ...APPLICANT, ruleSetMatched: false, redeemedInPack: 1000 }),
    ).toBe(true);
  });

  it("refuses outside the pack or product, without a rule-set match, or over the cap", () => {
    expect(offerEligible(OFFERS.startup, { ...APPLICANT, pack: "us" })).toBe(false);
    expect(offerEligible(OFFERS.startup, { ...APPLICANT, product: "juristra" })).toBe(false);
    expect(offerEligible(OFFERS.startup, { ...APPLICANT, ruleSetMatched: false })).toBe(false);
    expect(offerEligible(OFFERS.startup, { ...APPLICANT, redeemedInPack: 2 })).toBe(false);
  });
});
