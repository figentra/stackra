/**
 * Stackra file contract:
 * Purpose: unit tests of `formatDateTime` and `dateTimeFormatIn`, the digits matrix: Latin and Arabic-Indic digits in
 *          English and Arabic whatever the tag's own keyword says, a locale's own separators kept, the tag's keyword
 *          by default, and an invalid date refused.
 * Boundary: test only; every case names `timeZone: "UTC"`.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0192 (decisions 2, as amended 2026-10-28, and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { dateTimeFormatIn } from "#core/functions/date-time-format-in.function";
import { formatDateTime } from "#core/functions/format-date-time.function";
import { intlLocale } from "#core/functions/intl-locale.function";

const { Latn, Arab } = NumberingSystem;

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
