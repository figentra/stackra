/**
 * Stackra file contract:
 * Purpose: proves `previousRangeOf`, `periodOf`, `formatDateRange` and the new preset periods: equal-length previous
 *          periods, whole months and quarters stepping back by month (short months, leap years), the same period last
 *          year across 29 February, and open ranges left alone.
 * Boundary: pure functions; no rendering.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0307 (decision 17); STA-1371.
 */
import { CalendarDate, parseDate } from "@internationalized/date";

import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { formatDateRange } from "#core/functions/format-date-range.function";
import { periodOf } from "#core/functions/period-of.function";
import { previousRangeOf } from "#core/functions/previous-range-of.function";

/** A range from two ISO days. */
const range = (start: string, end: string) => ({ start: parseDate(start), end: parseDate(end) });
/** A range as ISO text. */
const text = (value: { start: CalendarDate | null; end: CalendarDate | null }) =>
  `${value.start?.toString()}/${value.end?.toString()}`;

describe("previousRangeOf", () => {
  it("takes the same number of days just before", () => {
    expect(text(previousRangeOf(range("2026-10-01", "2026-10-07"), "previous"))).toBe(
      "2026-09-24/2026-09-30",
    );
    expect(text(previousRangeOf(range("2026-10-29", "2026-10-29"), "previous"))).toBe(
      "2026-10-28/2026-10-28",
    );
  });

  it("steps a whole month back to the whole month before, short or long", () => {
    expect(text(previousRangeOf(range("2026-03-01", "2026-03-31"), "previous"))).toBe(
      "2026-02-01/2026-02-28",
    );
    expect(text(previousRangeOf(range("2024-03-01", "2024-03-31"), "previous"))).toBe(
      "2024-02-01/2024-02-29",
    );
    expect(text(previousRangeOf(range("2026-01-01", "2026-03-31"), "previous"))).toBe(
      "2025-10-01/2025-12-31",
    );
  });

  it("takes the same days a year earlier, across leap days", () => {
    expect(text(previousRangeOf(range("2026-10-01", "2026-10-15"), "year"))).toBe(
      "2025-10-01/2025-10-15",
    );
    expect(text(previousRangeOf(range("2024-02-01", "2024-02-29"), "year"))).toBe(
      "2023-02-01/2023-02-28",
    );
    expect(text(previousRangeOf(range("2025-02-01", "2025-02-28"), "year"))).toBe(
      "2024-02-01/2024-02-29",
    );
  });

  it("leaves an open range as it is", () => {
    const open = { start: parseDate("2026-10-01"), end: null };
    expect(previousRangeOf(open, "previous")).toBe(open);
  });
});

describe("periodOf", () => {
  it("adds the comparison only while a mode is on", () => {
    const days = range("2026-10-01", "2026-10-31");
    expect(periodOf("this_month", days, null).compare).toBeNull();
    expect(text(periodOf("this_month", days, "previous").compare?.range ?? days)).toBe(
      "2026-09-01/2026-09-30",
    );
  });
});

describe("the dashboard presets", () => {
  const today = new CalendarDate(2026, 11, 14);

  it("works out quarters, 90 days and 12 months", () => {
    expect(text(dateRangeOfPreset("this_quarter", today))).toBe("2026-10-01/2026-12-31");
    expect(text(dateRangeOfPreset("last_quarter", today))).toBe("2026-07-01/2026-09-30");
    expect(text(dateRangeOfPreset("last_quarter", new CalendarDate(2026, 2, 3)))).toBe(
      "2025-10-01/2025-12-31",
    );
    expect(text(dateRangeOfPreset("last_90_days", today))).toBe("2026-08-17/2026-11-14");
    expect(text(dateRangeOfPreset("last_12_months", today))).toBe("2025-11-15/2026-11-14");
  });
});

describe("formatDateRange", () => {
  it("writes the range in the locale, empty while open", () => {
    expect(formatDateRange(range("2026-09-01", "2026-09-30"), "en-US")).toContain("Sep");
    expect(formatDateRange({ start: null, end: null }, "en-US")).toBe("");
  });
});
