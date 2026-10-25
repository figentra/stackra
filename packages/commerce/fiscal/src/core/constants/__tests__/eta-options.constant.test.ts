/**
 * Stackra file contract:
 * Purpose: unit tests of `ETA_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { ETA_OPTIONS } from "#core/constants/eta-options.constant";

const SAMPLE = {
  submitUrl: "https://authority.test/submissions",
  documentTypeVersion: "1.0",
  activityCode: "0000",
  reportingCurrency: "EUR",
  taxTypes: { S: { taxType: "T1", subType: "V1" } },
};

describe("ETA_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(ETA_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `activityCode`", () => {
    const { activityCode: _left, ...rest } = SAMPLE;
    expect(ETA_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("refuses a tax type without a subtype", () => {
    expect(ETA_OPTIONS.safeParse({ ...SAMPLE, taxTypes: { S: { taxType: "T1" } } }).success).toBe(
      false,
    );
  });
});
