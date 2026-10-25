/**
 * Stackra file contract:
 * Purpose: unit tests of `FACTUR_X_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { FACTUR_X_OPTIONS } from "#core/constants/factur-x-options.constant";

const SAMPLE = {
  guidelineId: "urn:sample:guideline",
  fileName: "invoice.xml",
  conformanceLevel: "LEVEL",
  version: "1.0",
  documentType: "INVOICE",
  submitUrl: null,
  timeZone: "UTC",
};

describe("FACTUR_X_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(FACTUR_X_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `guidelineId`", () => {
    const { guidelineId: _left, ...rest } = SAMPLE;
    expect(FACTUR_X_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("takes a platform URL in place of null", () => {
    expect(
      FACTUR_X_OPTIONS.safeParse({ ...SAMPLE, submitUrl: "https://platform.test" }).success,
    ).toBe(true);
  });
});
