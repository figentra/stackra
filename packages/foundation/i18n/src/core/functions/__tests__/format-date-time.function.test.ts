/**
 * Stackra file contract:
 * Purpose: unit tests of `formatDateTime` and `dateTimeFormatIn`, the digits matrix: Latin and Arabic-Indic digits in
 *          English and Arabic whatever the tag's own keyword says, a locale's own separators kept, the tag's keyword
 *          by default, and an invalid date refused; and the calendar: Gregorian by default, the Umm al-Qura Hijri
 *          calendar on request, a Ramadan date and the months either side of it, in English and Arabic.
 * Boundary: test only; every case names `timeZone: "UTC"`.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0192 (decisions 2, as amended 2026-10-28, and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { CalendarSystem } from "#core/enums/calendar-system.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { dateTimeFormatIn } from "#core/functions/date-time-format-in.function";
import { formatDateTime } from "#core/functions/format-date-time.function";
import { intlLocale } from "#core/functions/intl-locale.function";

const { Latn, Arab } = NumberingSystem;
const { Gregory, IslamicUmalqura } = CalendarSystem;

const DAY = "2026-10-28T09:05:00Z";
const NUMERIC = { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" } as const;

/** The bidi marks Intl adds in Arabic dates, which this matrix does not compare. */
const bare = (text: string) =>
  text.replaceAll(/[\u200e\u200f\u061c]/g, "").replaceAll(/[\u00a0\u202f]/g, " ");

describe("formatDateTime", () => {
  it.each([
    ["en", Latn, "10/28/2026"],
    ["ar", Latn, "28/10/2026"],
    ["en", Arab, "١٠/٢٨/٢٠٢٦"],
    ["ar", Arab, "٢٨/١٠/٢٠٢٦"],
  ] as const)("writes %s in %s digits", (locale, numerals, expected) => {
    for (const tag of [intlLocale(locale, numerals), locale])
      expect(bare(formatDateTime(DAY, tag, NUMERIC, numerals))).toBe(expected);
  });

  it("keeps the locale's separators and takes the tag's digits by default", () => {
    expect(formatDateTime(DAY, "de-u-nu-arab", NUMERIC)).toBe("٢٨.١٠.٢٠٢٦");
    expect(formatDateTime(DAY, "en-u-nu-arab", { timeStyle: "short", timeZone: "UTC" })).toBe(
      "٩:٠٥ AM",
    );
  });

  it("refuses an invalid date", () => {
    expect(() => formatDateTime("not a date", "en")).toThrow(RangeError);
  });
});

describe("dateTimeFormatIn", () => {
  it("formats like Intl.DateTimeFormat, in the digits", () => {
    expect(
      dateTimeFormatIn("en", { year: "numeric", timeZone: "UTC" }, Arab).format(Date.parse(DAY)),
    ).toBe("٢٠٢٦");
  });
});

/** 1 Ramadan 1447 in the Umm al-Qura calendar is 18 February 2026. */
const RAMADAN_1 = "2026-02-18T12:00:00Z";

/** The Hijri month number of `day` (`9` for Ramadan), from the numeric English form (`9/1/1447 AH`). */
const hijriMonth = (day: string) =>
  Number(formatDateTime(day, "en", NUMERIC, Latn, IslamicUmalqura).split("/")[0]);

describe("the calendar", () => {
  it("writes Gregorian by default and when asked", () => {
    expect(formatDateTime(RAMADAN_1, "en", NUMERIC, Latn)).toBe("2/18/2026");
    expect(formatDateTime(RAMADAN_1, "en", NUMERIC, Latn, Gregory)).toBe("2/18/2026");
  });

  it("writes the Umm al-Qura date of a Ramadan day", () => {
    expect(bare(formatDateTime(RAMADAN_1, "en", NUMERIC, Latn, IslamicUmalqura))).toBe(
      "9/1/1447 AH",
    );
    const arabic = bare(
      formatDateTime(
        RAMADAN_1,
        "ar",
        { day: "numeric", month: "long", timeZone: "UTC" },
        Latn,
        IslamicUmalqura,
      ),
    );
    expect(arabic).toContain("رمضان");
    expect(arabic).toContain("1");
  });

  it("changes month at the Hijri boundaries, not the Gregorian ones", () => {
    // Shaʻban (8) ends and Ramadan (9) starts between 17 and 18 February
    expect(hijriMonth("2026-02-17T12:00:00Z")).toBe(8);
    expect(hijriMonth(RAMADAN_1)).toBe(9);
    // Ramadan is still running on 18 March and Shawwal (10) has started by 21 March
    expect(hijriMonth("2026-03-18T12:00:00Z")).toBe(9);
    expect(hijriMonth("2026-03-21T12:00:00Z")).toBe(10);
    // the Gregorian month turns over on 1 March while the Hijri month does not
    expect(formatDateTime("2026-02-28T12:00:00Z", "en", NUMERIC, Latn)).toBe("2/28/2026");
    expect(formatDateTime("2026-03-01T12:00:00Z", "en", NUMERIC, Latn)).toBe("3/1/2026");
    expect(hijriMonth("2026-02-28T12:00:00Z")).toBe(hijriMonth("2026-03-01T12:00:00Z"));
  });

  it("writes Hijri dates in the chosen digits", () => {
    expect(bare(formatDateTime(RAMADAN_1, "en", NUMERIC, Arab, IslamicUmalqura))).toBe(
      "٩/١/١٤٤٧ AH",
    );
  });

  it("lets an explicit options.calendar win", () => {
    expect(
      formatDateTime(RAMADAN_1, "en", { ...NUMERIC, calendar: "gregory" }, Latn, IslamicUmalqura),
    ).toBe("2/18/2026");
  });
});
