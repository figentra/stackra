/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Locale`: the twelve codes (seven base languages and five regional overlays) in BCP
 *          47 case and source order, the case names the template uses, an endonym, a week start and a clock for every
 *          case, and a same-named type that accepts the codes as plain literals (gen's `fallbacks` table) but refuses
 *          an unknown tag.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (as amended by 0305 conventions 1); ADR 0403.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { HourCycle } from "#core/enums/hour-cycle.enum";
import { Locale } from "#core/enums/locale.enum";

describe("Locale", () => {
  it("holds the seven base languages and their overlays in BCP 47 case", () => {
    expect(Enum.values(Locale)).toEqual([
      "en",
      "en-US",
      "ar",
      "ar-SA",
      "ar-AE",
      "ar-EG",
      "fr",
      "de",
      "es",
      "es-US",
      "it",
      "nl",
    ]);
    expect([Locale.Es, Locale.EsUs, Locale.It, Locale.Nl]).toEqual(["es", "es-US", "it", "nl"]);
    expect(Enum.values(Locale).filter((code) => !code.includes("-"))).toEqual([
      "en",
      "ar",
      "fr",
      "de",
      "es",
      "it",
      "nl",
    ]);
  });

  it("names every locale in its own language", () => {
    expect(Enum.meta(Locale, Locale.En).endonym).toBe("English");
    expect(Enum.meta(Locale, Locale.Ar).endonym).toBe("العربية");
    expect(Enum.meta(Locale, Locale.Nl).endonym).toBe("Nederlands");
    for (const code of Enum.values(Locale)) expect(Enum.meta(Locale, code).endonym).not.toBe("");
  });

  it("starts the European weeks on Monday with a 24-hour clock, the American ones on Sunday", () => {
    for (const code of [Locale.Fr, Locale.De, Locale.Es, Locale.It, Locale.Nl])
      expect(Enum.meta(Locale, code)).toMatchObject({ weekStart: 1, hourCycle: HourCycle.H23 });
    for (const code of [Locale.EnUs, Locale.EsUs, Locale.ArSa])
      expect(Enum.meta(Locale, code)).toMatchObject({ weekStart: 7, hourCycle: HourCycle.H12 });
    expect(Enum.meta(Locale, Locale.ArEg).weekStart).toBe(6);
    for (const code of Enum.values(Locale)) {
      const { weekStart } = Enum.meta(Locale, code);
      expect(weekStart >= 1 && weekStart <= 7).toBe(true);
    }
  });

  it("types the codes as a union that plain literals satisfy", () => {
    expectTypeOf<Locale>().toEqualTypeOf<
      | "en"
      | "en-US"
      | "ar"
      | "ar-SA"
      | "ar-AE"
      | "ar-EG"
      | "fr"
      | "de"
      | "es"
      | "es-US"
      | "it"
      | "nl"
    >();
    const chain: Locale[] = ["ar", "en", "nl"];
    // @ts-expect-error -- not a shipped locale
    const unknown: Locale = "tr";
    expect([...chain, unknown]).toHaveLength(4);
  });
});
