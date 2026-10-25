/**
 * Stackra file contract:
 * Purpose: unit tests of `FDM_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { FDM_OPTIONS } from "#core/constants/fdm-options.constant";

const SAMPLE = {
  vatRateSlots: { "20": "A" },
  eventTypes: { invoice: "a", simplified: "b", credit_note: "c", debit_note: "d" },
};

describe("FDM_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(FDM_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `eventTypes`", () => {
    const { eventTypes: _left, ...rest } = SAMPLE;
    expect(FDM_OPTIONS.safeParse(rest).success).toBe(false);
  });
});
