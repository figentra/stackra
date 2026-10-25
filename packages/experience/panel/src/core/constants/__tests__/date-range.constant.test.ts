/**
 * Stackra file contract:
 * Purpose: unit tests of `DateRange`: the relative values are TimeRange codes and `between` a fixed window.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 9 and 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { DateRange } from "#core/constants/date-range.constant";

describe("DateRange", () => {
  it("builds date filter values", () => {
    expect([
      DateRange.today(),
      DateRange.yesterday(),
      DateRange.last7Days(),
      DateRange.last30Days(),
      DateRange.thisMonth(),
    ]).toEqual(["today", "yesterday", "last_7_days", "last_30_days", "this_month"]);
    const from = new Date("2026-10-01T00:00:00Z");
    const to = new Date("2026-10-08T00:00:00Z");
    expect(DateRange.between(from, to)).toEqual({ from, to });
  });
});
