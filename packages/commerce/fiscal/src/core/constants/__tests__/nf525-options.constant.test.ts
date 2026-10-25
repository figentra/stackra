/**
 * Stackra file contract:
 * Purpose: unit tests of `NF525_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { NF525_OPTIONS } from "#core/constants/nf525-options.constant";

const SAMPLE = {
  operationTypes: { invoice: "a", simplified: "b", credit_note: "c", debit_note: "d" },
  timeZone: "UTC",
};

describe("NF525_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(NF525_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `operationTypes`", () => {
    const { operationTypes: _left, ...rest } = SAMPLE;
    expect(NF525_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("refuses operation types that miss a kind", () => {
    expect(NF525_OPTIONS.safeParse({ ...SAMPLE, operationTypes: { invoice: "a" } }).success).toBe(
      false,
    );
  });
});
