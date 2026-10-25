/**
 * Stackra file contract:
 * Purpose: unit tests of `RKSV_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RKSV_OPTIONS } from "#core/constants/rksv-options.constant";

const SAMPLE = {
  providerId: "P1",
  rateBuckets: { "20": "normal", "10": "reduced1" },
  timeZone: "UTC",
};

describe("RKSV_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(RKSV_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `providerId`", () => {
    const { providerId: _left, ...rest } = SAMPLE;
    expect(RKSV_OPTIONS.safeParse(rest).success).toBe(false);
  });

  it("refuses an unknown bucket", () => {
    expect(RKSV_OPTIONS.safeParse({ ...SAMPLE, rateBuckets: { "20": "other" } }).success).toBe(
      false,
    );
  });
});
