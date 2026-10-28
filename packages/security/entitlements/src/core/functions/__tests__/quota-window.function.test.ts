/**
 * Stackra file contract:
 * Purpose: unit tests of `quotaWindow`: the UTC day, month and year that hold an instant, across month and year ends.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0216 (decisions 2 and 3); stackra-309.
 */
import { describe, expect, it } from "@stackra/testing";

import { QuotaPeriod } from "#core/enums/quota-period.enum";
import { quotaWindow } from "#core/functions/quota-window.function";

const iso = ({ from, to }: { readonly from: Date; readonly to: Date }): readonly string[] => [
  from.toISOString(),
  to.toISOString(),
];

describe("quotaWindow", () => {
  it("is the UTC day, month or year that holds the instant", () => {
    const at = new Date("2026-10-28T23:30:00Z");
    expect(iso(quotaWindow(QuotaPeriod.Day, at))).toEqual([
      "2026-10-28T00:00:00.000Z",
      "2026-10-29T00:00:00.000Z",
    ]);
    expect(iso(quotaWindow(QuotaPeriod.Month, at))).toEqual([
      "2026-10-01T00:00:00.000Z",
      "2026-11-01T00:00:00.000Z",
    ]);
    expect(iso(quotaWindow(QuotaPeriod.Year, at))).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2027-01-01T00:00:00.000Z",
    ]);
  });

  it("rolls over the last day of a month and of a year", () => {
    const at = new Date("2026-12-31T12:00:00Z");
    expect(iso(quotaWindow(QuotaPeriod.Day, at))).toEqual([
      "2026-12-31T00:00:00.000Z",
      "2027-01-01T00:00:00.000Z",
    ]);
    expect(iso(quotaWindow(QuotaPeriod.Month, at))[1]).toBe("2027-01-01T00:00:00.000Z");
  });
});
