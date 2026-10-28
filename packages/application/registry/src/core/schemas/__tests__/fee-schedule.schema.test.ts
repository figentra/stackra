/**
 * Stackra file contract:
 * Purpose: unit tests of `FeeSchedule`: the shipped schema is registered, the fixed fee defaults to zero, and a rate
 *          outside 0 to 10,000 basis points, a fractional rate or a bad currency fails.
 * Boundary: test only; the rates are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { FEE_SCHEDULE_SCHEMA } from "#core/constants/fee-schedule-schema.constant";
import { FeeSchedule } from "#core/schemas/fee-schedule.schema";

const base = {
  key: "partner-test",
  currency: "SAR",
  basisPoints: 1500,
  effectiveFrom: "2026-11-01",
};

describe("FeeSchedule", () => {
  it("registers the shipped schema and defaults the fixed fee", () => {
    expect(schemaOf(FeeSchedule)).toBe(FEE_SCHEDULE_SCHEMA);
    const result = validate(FeeSchedule, base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fixedMinor).toBe(0);
  });

  it("refuses an out-of-range or fractional rate and a bad currency", () => {
    expect(validate(FeeSchedule, { ...base, basisPoints: 10_001 }).success).toBe(false);
    expect(validate(FeeSchedule, { ...base, basisPoints: 1.5 }).success).toBe(false);
    expect(validate(FeeSchedule, { ...base, currency: "sar" }).success).toBe(false);
  });
});
