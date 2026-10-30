/**
 * Stackra file contract:
 * Purpose: proves the locale and time helpers' edges: the week start from `getWeekInfo`, the older `weekInfo`
 *          property, or the language default when the runtime has neither or rejects the tag; the remaining date-range
 *          presets; 24-hour wheels in Latin digits and midnight on 12-hour wheels; a locale that cannot take a script;
 *          a language name for a bad tag; Arabic-Indic and Persian digits and separators; the phone country search
 *          and list; and the spoken duration.
 * Boundary: pure; stubs the Intl global for the week-info cases and restores it.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";

import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { latinDigitsOf } from "#core/functions/latin-digits-of.function";
import { localeForDirection } from "#core/functions/locale-for-direction.function";
import { localeNameOf } from "#core/functions/locale-name-of.function";
import { phoneCountriesOf } from "#core/functions/phone-countries-of.function";
import { phoneCountryMatches } from "#core/functions/phone-country-matches.function";
import { spokenDurationOf } from "#core/functions/spoken-duration-of.function";
import { weekStartOf } from "#core/functions/week-start-of.function";
import { wheelTimeColumnsOf } from "#core/functions/wheel-time-columns-of.function";

/** Intl with `Locale` replaced by a class that reports `weekInfo` as given, or throws. */
const intlWithWeekInfo = (weekInfo: { firstDay?: number } | "throw" | undefined) => {
  const intl = Object.create(Intl) as typeof Intl;
  Object.defineProperty(intl, "Locale", {
    value: class {
      readonly weekInfo = weekInfo === "throw" ? undefined : weekInfo;

      constructor() {
        if (weekInfo === "throw") throw new RangeError("bad tag");
      }
    },
  });
  return intl;
};

describe("weekStartOf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the runtime's week info, Sunday as 0", () => {
    expect(weekStartOf("ar-SA")).toBe(0);
    expect(weekStartOf("de-DE")).toBe(1);
  });

  it("reads the older weekInfo property", () => {
    vi.stubGlobal("Intl", intlWithWeekInfo({ firstDay: 6 }));
    expect(weekStartOf("fa-IR")).toBe(6);
  });

  it.each([
    [undefined, "en-US", 0],
    [{}, "ar", 0],
    ["throw" as const, "fr", 1],
  ])("falls back to the language default when week info is %j (%s)", (info, locale, day) => {
    vi.stubGlobal("Intl", intlWithWeekInfo(info));
    expect(weekStartOf(locale)).toBe(day);
  });
});

describe("dateRangeOfPreset", () => {
  const today = new CalendarDate(2026, 2, 26);

  it.each([
    ["last_30_days", "2026-01-28", "2026-02-26"],
    ["this_month", "2026-02-01", "2026-02-28"],
    ["last_month", "2026-01-01", "2026-01-31"],
    ["this_year", "2026-01-01", "2026-12-31"],
  ] as const)("spans %s from %s to %s", (preset, start, end) => {
    const range = dateRangeOfPreset(preset, today);
    expect([range.start.toString(), range.end.toString()]).toEqual([start, end]);
  });
});

const labels = { hour: "Hour", minute: "Minute", period: "Period" };

/** The 12-hour wheels' value at `hour` o'clock. */
const at = (hour: number) =>
  wheelTimeColumnsOf({
    value: { hour, minute: 0 },
    minuteStep: 15,
    hourCycle: 12,
    locale: "en",
    labels,
  }).value;

describe("wheelTimeColumnsOf", () => {
  it("draws 24 hours in the locale's own digits with no period wheel", () => {
    const wheels = wheelTimeColumnsOf({
      value: { hour: 0, minute: 59 },
      minuteStep: 0,
      hourCycle: 24,
      locale: "en",
      labels,
    });
    expect(wheels.columns.map((column) => column.items.length)).toEqual([24, 60]);
    expect(wheels.columns[0]?.items[0]?.label).toBe("00");
    expect(wheels.value).toEqual({ hour: "0", minute: "59" });
  });

  it("reads midnight as 12 am and noon as 12 pm", () => {
    expect(at(0)).toEqual({ hour: "12", minute: "0", period: "am" });
    expect(at(12)).toEqual({ hour: "12", minute: "0", period: "pm" });
  });
});

describe("localeForDirection", () => {
  it("keeps a locale that already reads that way and adds a script otherwise", () => {
    expect(localeForDirection("ar-SA", "rtl")).toBe("ar-SA");
    expect(localeForDirection("en", "rtl")).toBe("en-Arab");
  });

  it("falls back to Arabic when the tag cannot take a script", () => {
    expect(localeForDirection("!!", "rtl")).toBe("ar");
  });
});

describe("localeNameOf", () => {
  it("names a language in itself, capitalised, and returns a bad tag as it is", () => {
    expect(localeNameOf("en")).toBe("English");
    expect(localeNameOf("ar")).toBe("العربية");
    expect(localeNameOf("!!")).toBe("!!");
  });
});

describe("latinDigitsOf", () => {
  it.each([
    ["١٢٣٫٤٥", "123.45"],
    ["۱۲۳٬۴۵۶", "123,456"],
    ["abc 7", "abc 7"],
    ["", ""],
  ])("reads %j as %j", (text, expected) => {
    expect(latinDigitsOf(text)).toBe(expected);
  });
});

describe("phoneCountryMatches and phoneCountriesOf", () => {
  const countries = phoneCountriesOf("en", ["SA", "AE", "ZZ"]);
  const saudi = countries.find((country) => country.code === "SA");

  it("lists only countries with a dial code, sorted by name", () => {
    expect(countries.map((country) => country.code)).toEqual(["SA", "AE"]);
    expect(saudi).toMatchObject({ dial: "966", flag: "🇸🇦" });
    expect(phoneCountriesOf("en").length).toBeGreaterThan(200);
  });

  it.each([
    ["", true],
    ["  ", true],
    ["+966", true],
    ["٩٦٦", true],
    ["۹۶۶", true],
    ["saudi", true],
    ["السعودية", true],
    ["sa", true],
    ["971", false],
  ])("matches %j: %s", (query, expected) => {
    expect(saudi && phoneCountryMatches(saudi, query)).toBe(expected);
  });
});

/** Formats a number in English. */
const format = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en", options).format(value);

describe("spokenDurationOf", () => {
  it("names the non-zero units, or the seconds when there are none", () => {
    expect(spokenDurationOf({ days: 1, hours: 0, minutes: 5, seconds: 9 }, format, "en")).toBe(
      "1 day, 5 minutes",
    );
    expect(spokenDurationOf({ days: 0, hours: 0, minutes: 0, seconds: 9 }, format, "en")).toBe(
      "9 seconds",
    );
  });
});
