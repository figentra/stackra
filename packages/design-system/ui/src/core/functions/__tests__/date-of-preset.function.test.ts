/**
 * Stackra file contract:
 * Purpose: proves `dateOfPreset` counts each preset from today and agrees with the range presets on today and
 *          yesterday.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";

import { DatePreset } from "#contracts/enums/date-preset.enum";
import { dateOfPreset } from "#core/functions/date-of-preset.function";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";

describe("dateOfPreset", () => {
  const today = new CalendarDate(2026, 2, 26);

  it("counts each preset from today", () => {
    expect(DatePreset.map((preset) => dateOfPreset(preset, today).toString())).toEqual([
      "2026-02-26",
      "2026-02-25",
      "2026-02-27",
      "2026-03-05",
      "2026-02-01",
      "2026-02-28",
    ]);
  });

  it("matches the range presets", () => {
    expect(dateOfPreset("yesterday", today)).toEqual(dateRangeOfPreset("yesterday", today).start);
  });
});
