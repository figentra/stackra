/**
 * Stackra file contract:
 * Purpose: unit tests of `TSE_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { TSE_OPTIONS } from "#core/constants/tse-options.constant";

const SAMPLE = {
  processType: "Sample-V1",
  vatRateSlots: { "20": 1, "10": 2 },
  paymentTypes: { cash: "Bar" },
  homeCurrency: "EUR",
};

describe("TSE_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(TSE_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `processType`", () => {
    const { processType: _left, ...rest } = SAMPLE;
    expect(TSE_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("refuses a slot outside 1 to 5", () => {
    expect(TSE_OPTIONS.safeParse({ ...SAMPLE, vatRateSlots: { "20": 6 } }).success).toBe(false);
  });
});
