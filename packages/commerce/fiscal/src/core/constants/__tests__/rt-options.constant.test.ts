/**
 * Stackra file contract:
 * Purpose: unit tests of `RT_OPTIONS`: a complete pack section passes and a section missing a field or holding a misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RT_OPTIONS } from "#core/constants/rt-options.constant";

const SAMPLE = {
  documentTypes: { invoice: "a", simplified: "b", credit_note: "c", debit_note: "d" },
  paymentTypes: { cash: "1" },
};

describe("RT_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(RT_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `documentTypes`", () => {
    const { documentTypes: _left, ...rest } = SAMPLE;
    expect(RT_OPTIONS.safeParse(rest).success).toBe(false);
  });
});
