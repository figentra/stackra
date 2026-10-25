/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Locale`: the eight codes in BCP 47 case and source order, the case names the
 *          template uses, an endonym for every case, and a same-named type that accepts the codes as plain literals
 *          (gen's `fallbacks` table) but refuses an unknown tag.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (as amended by 0305 conventions 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Locale } from "#core/enums/locale.enum";

describe("Locale", () => {
  it("holds the base languages and their overlays in BCP 47 case", () => {
    expect(Enum.values(Locale)).toEqual([
      "en",
      "en-US",
      "ar",
      "ar-SA",
      "ar-AE",
      "ar-EG",
      "fr",
      "de",
    ]);
    expect([
      Locale.En,
      Locale.EnUs,
      Locale.Ar,
      Locale.ArSa,
      Locale.ArAe,
      Locale.ArEg,
      Locale.Fr,
      Locale.De,
    ]).toEqual(["en", "en-US", "ar", "ar-SA", "ar-AE", "ar-EG", "fr", "de"]);
  });

  it("names every locale in its own language", () => {
    expect(Enum.meta(Locale, Locale.En).endonym).toBe("English");
    expect(Enum.meta(Locale, Locale.Ar).endonym).toBe("العربية");
    for (const code of Enum.values(Locale)) expect(Enum.meta(Locale, code).endonym).not.toBe("");
  });

  it("types the codes as a union that plain literals satisfy", () => {
    expectTypeOf<Locale>().toEqualTypeOf<
      "en" | "en-US" | "ar" | "ar-SA" | "ar-AE" | "ar-EG" | "fr" | "de"
    >();
    const chain: Locale[] = ["ar", "en"];
    // @ts-expect-error -- not a shipped locale
    const unknown: Locale = "tr";
    expect(chain.concat(unknown)).toHaveLength(3);
  });
});
