/**
 * Stackra file contract:
 * Purpose: unit tests of `intlLocale`: Latin and Arabic-Indic digits become the `nu` keyword and a clock the `hc`
 *          keyword of the `-u-` extension Intl applies, the user's own digits and no clock add nothing, and the
 *          seven languages format decimals with the separator their locale uses (comma in fr, de, es, it and nl).
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decision 2); ADR 0403.
 */
import { describe, expect, it } from "@stackra/testing";

import { HourCycle } from "#core/enums/hour-cycle.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { intlLocale } from "#core/functions/intl-locale.function";

describe("intlLocale", () => {
  it("adds the nu keyword for a forced numbering system", () => {
    expect(intlLocale("ar-SA", NumberingSystem.Latn)).toBe("ar-SA-u-nu-latn");
    expect(intlLocale("en", NumberingSystem.Arab)).toBe("en-u-nu-arab");
    expect(new Intl.NumberFormat(intlLocale("ar", NumberingSystem.Latn)).format(42)).toBe("42");
  });

  it("adds the hc keyword for a clock, before the digits", () => {
    expect(intlLocale("nl", NumberingSystem.Latn, HourCycle.H23)).toBe("nl-u-hc-h23-nu-latn");
    expect(intlLocale("en-US", NumberingSystem.User, HourCycle.H12)).toBe("en-US-u-hc-h12");
    const time = new Intl.DateTimeFormat(intlLocale("en", NumberingSystem.Latn, HourCycle.H23), {
      timeStyle: "short",
      timeZone: "UTC",
    });
    expect(time.format(new Date("2026-10-24T18:05:00Z"))).toBe("18:05");
  });

  it("leaves the locale alone for the user's own digits and no clock", () => {
    expect(intlLocale("ar", NumberingSystem.User)).toBe("ar");
  });

  it("writes the comma decimal where the language uses it", () => {
    const decimal = (locale: string) =>
      new Intl.NumberFormat(intlLocale(locale, NumberingSystem.Latn)).format(1.5);
    for (const locale of ["fr", "de", "es", "it", "nl"]) expect(decimal(locale)).toBe("1,5");
    for (const locale of ["en", "en-US", "es-US"]) expect(decimal(locale)).toBe("1.5");
  });
});
