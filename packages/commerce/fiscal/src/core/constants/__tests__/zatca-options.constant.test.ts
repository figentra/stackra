/**
 * Stackra file contract:
 * Purpose: unit tests of `ZATCA_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { ZATCA_OPTIONS } from "#core/constants/zatca-options.constant";

const SAMPLE = {
  reportingUrl: "https://authority.test/reporting",
  clearanceUrl: "https://authority.test/clearance",
  complianceCsidUrl: "https://authority.test/compliance",
  complianceInvoicesUrl: "https://authority.test/compliance/invoices",
  productionCsidUrl: "https://authority.test/production",
  apiVersion: "V2",
  profileId: "reporting:1.0",
  taxCurrency: "EUR",
  paymentMeans: { cash: "10" },
  timeZone: "UTC",
};

describe("ZATCA_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(ZATCA_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `reportingUrl`", () => {
    const { reportingUrl: _left, ...rest } = SAMPLE;
    expect(ZATCA_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("refuses an endpoint that is not a URL", () => {
    expect(ZATCA_OPTIONS.safeParse({ ...SAMPLE, clearanceUrl: "clearance" }).success).toBe(false);
  });
});
