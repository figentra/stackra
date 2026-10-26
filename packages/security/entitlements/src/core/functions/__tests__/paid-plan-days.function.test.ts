/**
 * Stackra file contract:
 * Purpose: unit tests of `paidPlanDays`: whole days since `paidSince`; none or a future date is 0.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; owner R1-OS-40 (cap lift); stackra-117 (STA-1247).
 */
import { describe, expect, it } from "@stackra/testing";

import { paidPlanDays } from "#core/functions/paid-plan-days.function";

const NOW = new Date("2026-10-27T12:00:00Z");

describe("paidPlanDays", () => {
  it("counts whole days since the paid plan began", () => {
    expect(paidPlanDays({ paidSince: new Date("2026-10-17T13:00:00Z") }, NOW)).toBe(9);
    expect(paidPlanDays({ paidSince: NOW }, NOW)).toBe(0);
  });

  it("is 0 with no paid plan or a future start", () => {
    expect(paidPlanDays({}, NOW)).toBe(0);
    expect(paidPlanDays({ paidSince: new Date("2026-11-01T00:00:00Z") }, NOW)).toBe(0);
  });
});
