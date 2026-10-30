/**
 * Stackra file contract:
 * Purpose: proves the wave 3a form and picker functions: the Hijri locale tag and years, the preset ranges, the month
 *          grid, the range presses, the wheel columns and the time they stand for, the wheel's settling row, the phone
 *          value, the typed colour, the flag, the country list, the emoji search and the Gregorian conversion.
 * Boundary: pure functions; Intl from Node (full ICU).
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0022 (test placement).
 */
import { CalendarDate, IslamicUmalquraCalendar, toCalendar } from "@internationalized/date";

import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";
import { countryItemsOf } from "#core/functions/country-items-of.function";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { emojiMatches } from "#core/functions/emoji-matches.function";
import { flagOf } from "#core/functions/flag-of.function";
import { hexColorOf } from "#core/functions/hex-color-of.function";
import { hijriYearsOf } from "#core/functions/hijri-years-of.function";
import { hourCycleOf } from "#core/functions/hour-cycle-of.function";
import { localeNameOf } from "#core/functions/locale-name-of.function";
import { monthGridOf } from "#core/functions/month-grid-of.function";
import { nextRangeOf } from "#core/functions/next-range-of.function";
import { phoneValueOf } from "#core/functions/phone-value-of.function";
import { timeOfWheels } from "#core/functions/time-of-wheels.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import { wheelDateColumnsOf } from "#core/functions/wheel-date-columns-of.function";
import { wheelIndexOf } from "#core/functions/wheel-index-of.function";
import { wheelTimeColumnsOf } from "#core/functions/wheel-time-columns-of.function";
import { yearsBetween } from "#core/functions/years-between.function";

const DAY = new CalendarDate(2026, 3, 18);

describe("calendar and Hijri", () => {
  it("adds the calendar keyword and keeps a numbering one", () => {
    expect(calendarLocaleOf("ar-SA")).toBe("ar-SA");
    expect(calendarLocaleOf("ar-SA", "islamic-umalqura")).toBe("ar-SA-u-ca-islamic-umalqura");
    expect(calendarLocaleOf("ar-u-nu-arab", "islamic-umalqura")).toBe(
      "ar-u-ca-islamic-umalqura-nu-arab",
    );
  });

  it("writes the Hijri years a Gregorian year spans", () => {
    expect(hijriYearsOf(2026, "en")).toMatch(/^1447–1448$/);
  });

  it("turns a Hijri date back into the same Gregorian day", () => {
    const hijri = toCalendar(DAY, new IslamicUmalquraCalendar());
    expect(toGregorian(hijri).toString()).toBe("2026-03-18");
    expect(toGregorian(null)).toBeNull();
  });
});

describe("ranges", () => {
  it("works the presets out from today", () => {
    expect(dateRangeOfPreset("last_7_days", DAY)).toMatchObject({
      start: new CalendarDate(2026, 3, 12),
      end: DAY,
    });
    expect(dateRangeOfPreset("last_month", DAY).end.toString()).toBe("2026-02-28");
    expect(dateRangeOfPreset("this_year", DAY).end.toString()).toBe("2026-12-31");
  });

  it("starts a range on the first press and orders it on the second", () => {
    const first = nextRangeOf(null, DAY);
    expect(first).toEqual({ anchor: DAY, range: null });
    const second = nextRangeOf(DAY, new CalendarDate(2026, 3, 2));
    expect(second.range?.start.day).toBe(2);
    expect(second.range?.end.day).toBe(18);
    expect(second.anchor).toBeNull();
  });

  it("lays a month out in weeks from the locale's first weekday", () => {
    const grid = monthGridOf(DAY, "en-US");
    expect(grid.every((week) => week.length === 7)).toBe(true);
    // 1 March 2026 is a Sunday, the first weekday in en-US.
    expect(grid[0]?.[0]?.day).toBe(1);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
  });
});

describe("wheels", () => {
  it("orders the date wheels as the locale writes a date", () => {
    const labels = { day: "Day", month: "Month", year: "Year" };
    const us = wheelDateColumnsOf({
      value: DAY,
      minYear: 2020,
      maxYear: 2030,
      locale: "en-US",
      labels,
    });
    expect(us.columns.map((column) => column.id)).toEqual(["month", "day", "year"]);
    expect(us.value).toEqual({ day: "18", month: "3", year: "2026" });
    const gb = wheelDateColumnsOf({
      value: DAY,
      minYear: 2020,
      maxYear: 2030,
      locale: "en-GB",
      labels,
    });
    expect(gb.columns.map((column) => column.id)).toEqual(["day", "month", "year"]);
    expect(gb.columns[0]?.items).toHaveLength(31);
  });

  it("writes the time wheels in the chosen digits and reads them back", () => {
    const labels = { hour: "Hour", minute: "Minute", period: "Period" };
    const wheels = wheelTimeColumnsOf({
      value: { hour: 15, minute: 7 },
      minuteStep: 5,
      hourCycle: 12,
      locale: "ar",
      numerals: "arab",
      labels,
    });
    expect(wheels.value).toEqual({ hour: "3", minute: "5", period: "pm" });
    expect(wheels.columns[1]?.items[1]?.label).toBe("٠٥");
    expect(timeOfWheels(wheels.value, 12)).toEqual({ hour: 15, minute: 5 });
    expect(timeOfWheels({ hour: "12", minute: "0", period: "am" }, 12)).toEqual({
      hour: 0,
      minute: 0,
    });
    expect(timeOfWheels({ hour: "7", minute: "30" }, 24)).toEqual({ hour: 7, minute: 30 });
  });

  it("settles on the nearest enabled row", () => {
    const items = [
      { id: "a", label: "a" },
      { id: "b", label: "b", isDisabled: true },
      { id: "c", label: "c" },
    ];
    expect(wheelIndexOf(0, 36, items)).toBe(0);
    expect(wheelIndexOf(40, 36, items)).toBe(0);
    expect(wheelIndexOf(999, 36, items)).toBe(2);
    expect(wheelIndexOf(0, 36, [])).toBe(-1);
  });

  it("counts years and hour cycles", () => {
    expect(yearsBetween(2024, 2026)).toEqual([2024, 2025, 2026]);
    expect(yearsBetween(2026, 2024)).toEqual([]);
    expect(hourCycleOf("en-US")).toBe(12);
    expect(hourCycleOf("de-DE")).toBe(24);
  });
});

describe("fields", () => {
  it("keeps a phone number's national digits and builds its international form", () => {
    expect(phoneValueOf("SA", "٠٥٠ ١٢٣ ٤٥٦٧")).toEqual({
      country: "SA",
      national: "501234567",
      e164: "+966501234567",
    });
    expect(phoneValueOf("SA", "00966501234567")?.national).toBe("501234567");
    expect(phoneValueOf("SA", "abc")).toBeNull();
  });

  it("reads a typed colour", () => {
    expect(hexColorOf("#ABC")).toBe("#aabbcc");
    expect(hexColorOf("0f172a")).toBe("#0f172a");
    expect(hexColorOf("blue")).toBeNull();
  });

  it("draws flags and lists countries, preferred first", () => {
    expect(flagOf("sa")).toBe("🇸🇦");
    expect(flagOf("SAU")).toBe("");
    const items = countryItemsOf({
      locale: "en",
      countries: ["FR", "AE", "SA"],
      preferred: ["SA"],
      withDialCode: true,
    });
    expect(items.map((item) => item.id)).toEqual(["SA", "FR", "AE"]);
    expect(items[0]?.description).toContain("+966");
  });

  it("names a language in itself and finds emoji by word", () => {
    expect(localeNameOf("ar")).toBe("العربية");
    expect(localeNameOf("en")).toBe("English");
    expect(emojiMatches("thumbs up")).toContain("👍");
    expect(emojiMatches("zzzz")).toEqual([]);
  });
});
