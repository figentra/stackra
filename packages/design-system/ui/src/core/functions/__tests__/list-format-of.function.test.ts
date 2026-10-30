/**
 * Stackra file contract:
 * Purpose: proves `listFormatOf` joins with Intl.ListFormat where the runtime has it, and with the locale's comma where
 *          it does not (Hermes), where the components that used Intl.ListFormat directly threw; and that the other
 *          Hermes gaps (Intl.Locale, Intl.RelativeTimeFormat, DateTimeFormat#formatRange) leave
 *          `recurrenceWeekdaysFor`, `updatedAgoOf` and `formatDateRange` working.
 * Boundary: pure; stubs the Intl global for the Hermes cases and restores it.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";

import { formatDateRange } from "#core/functions/format-date-range.function";
import { listFormatOf } from "#core/functions/list-format-of.function";
import { recurrenceWeekdaysFor } from "#core/functions/recurrence-weekdays-for.function";
import { updatedAgoOf } from "#core/functions/updated-ago-of.function";

/** Intl as Hermes has it: no ListFormat, Locale, RelativeTimeFormat or DisplayNames. */
const HERMES_INTL = {
  Collator: Intl.Collator,
  DateTimeFormat: Intl.DateTimeFormat,
  NumberFormat: Intl.NumberFormat,
};

describe("listFormatOf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("joins with Intl.ListFormat", () => {
    expect(listFormatOf("en", { type: "conjunction" }).format(["A", "B", "C"])).toBe("A, B, and C");
  });

  it("joins with the locale's comma on Hermes", () => {
    vi.stubGlobal("Intl", HERMES_INTL);
    expect(listFormatOf("en").format(["A", "B"])).toBe("A, B");
    expect(listFormatOf("ar-SA").format(["أ", "ب"])).toBe("أ، ب");
  });

  it("leaves the weekdays, the time ago and a range of days working on Hermes", () => {
    const range = { start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 30) };
    const native = formatDateRange(range, "en");
    vi.stubGlobal("Intl", HERMES_INTL);
    const proto = Intl.DateTimeFormat.prototype;
    const formatRange = Object.getOwnPropertyDescriptor(proto, "formatRange");
    Object.defineProperty(proto, "formatRange", { value: undefined, configurable: true });
    try {
      expect(recurrenceWeekdaysFor("ar")).toHaveLength(7);
      const now = Date.UTC(2026, 9, 30, 12);
      expect(updatedAgoOf(now - 120_000, now, "en")).toMatch(/\d/);
      expect(native).toMatch(/^Sep\s1\s–\s30,\s2026$/);
      expect(formatDateRange(range, "en")).toMatch(/^Sep\s1,\s2026 – Sep\s30,\s2026$/);
    } finally {
      if (formatRange) Object.defineProperty(proto, "formatRange", formatRange);
    }
  });
});
