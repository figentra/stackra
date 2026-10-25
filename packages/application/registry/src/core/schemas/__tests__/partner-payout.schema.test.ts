/**
 * Stackra file contract:
 * Purpose: unit tests of `PartnerPayout`: the shipped schema is registered, a balanced payout parses, and a net that is
 *          not the gross less the fee, or a bad period, fails.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { PARTNER_PAYOUT_SCHEMA } from "#core/constants/partner-payout-schema.constant";
import { PartnerPayout } from "#core/schemas/partner-payout.schema";

const payout = {
  partner: "org_7",
  app: "acme.loyalty",
  period: "2026-11",
  currency: "SAR",
  grossMinor: 10_000,
  feeMinor: 2_000,
  netMinor: 8_000,
  schedule: "partner-test",
};

describe("PartnerPayout", () => {
  it("registers the shipped schema and parses a balanced payout", () => {
    expect(schemaOf(PartnerPayout)).toBe(PARTNER_PAYOUT_SCHEMA);
    expect(validate(PartnerPayout, payout).success).toBe(true);
  });

  it("refuses an unbalanced net and a bad period", () => {
    expect(validate(PartnerPayout, { ...payout, netMinor: 7_999 }).success).toBe(false);
    expect(validate(PartnerPayout, { ...payout, period: "2026-13" }).success).toBe(false);
  });
});
