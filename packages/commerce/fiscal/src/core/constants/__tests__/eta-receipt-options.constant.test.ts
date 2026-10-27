/**
 * Stackra file contract:
 * Purpose: unit tests of `ETA_RECEIPT_OPTIONS`: a complete pack section passes, a missing field or a status URL
 *          without the UUID placeholder is refused.
 * Boundary: test only; the sample values are made up (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { ETA_RECEIPT_OPTIONS } from "#core/constants/eta-receipt-options.constant";

const SAMPLE = {
  submitUrl: "https://authority.test/receipts",
  statusUrl: "https://authority.test/receipts/{uuid}/details",
  shareUrl: "https://portal.test/receipts/search",
  typeVersion: "1.0",
  activityCode: "0000",
  reportingCurrency: "EUR",
  taxTypes: { S: { taxType: "T1", subType: "V1" } },
  paymentMethods: { cash: "C" },
};

describe("ETA_RECEIPT_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(ETA_RECEIPT_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without payment methods", () => {
    const { paymentMethods: _left, ...rest } = SAMPLE;
    expect(ETA_RECEIPT_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("refuses a status URL without the UUID placeholder", () => {
    expect(
      ETA_RECEIPT_OPTIONS.safeParse({ ...SAMPLE, statusUrl: "https://authority.test/x" }).success,
    ).toBe(false);
  });
});
