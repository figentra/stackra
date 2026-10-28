/**
 * Stackra file contract:
 * Purpose: unit tests of `matchDeviceLocale`: an exact tag in any case, the base language, another region of the same
 *          language, the phone's order deciding, and `null` when nothing is shipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { Locale } from "#core/enums/locale.enum";
import { matchDeviceLocale } from "#core/functions/match-device-locale.function";

const SHIPPED = [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa];

describe("matchDeviceLocale", () => {
  it("takes the exact shipped locale, in any case", () => {
    expect(matchDeviceLocale(["ar-sa"], SHIPPED)).toBe(Locale.ArSa);
    expect(matchDeviceLocale(["en-US"], SHIPPED)).toBe(Locale.EnUs);
  });

  it("takes the base language, then another region of it", () => {
    expect(matchDeviceLocale(["ar-EG"], SHIPPED)).toBe(Locale.Ar);
    expect(matchDeviceLocale(["en-GB"], [Locale.EnUs, Locale.Fr])).toBe(Locale.EnUs);
  });

  it("follows the phone's order and gives null when nothing matches", () => {
    expect(matchDeviceLocale(["tr-TR", "fr-CA", "en-GB"], [Locale.En, Locale.Fr])).toBe(Locale.Fr);
    expect(matchDeviceLocale(["tr-TR"], SHIPPED)).toBeNull();
    expect(matchDeviceLocale([], SHIPPED)).toBeNull();
  });
});
