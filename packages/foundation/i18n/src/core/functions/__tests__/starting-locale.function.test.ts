/**
 * Stackra file contract:
 * Purpose: unit tests of `startingLocale`: under `system` the phone's language whatever `followDevice` says; under
 *          `in_app` the stored choice, then the phone's language only with `followDevice`, then the default; a stored
 *          choice that is no longer shipped is ignored.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { Locale } from "#core/enums/locale.enum";
import { NativeSwitcher } from "#core/enums/native-switcher.enum";
import { startingLocale } from "#core/functions/starting-locale.function";
import type { StartingLocaleInput } from "#core/types/starting-locale-input.type";

const BASE: StartingLocaleInput = {
  locales: [Locale.En, Locale.Ar],
  defaultLocale: Locale.En,
  followDevice: false,
  mode: NativeSwitcher.System,
  deviceTags: ["ar-SA", "en-GB"],
  chosen: null,
};

describe("startingLocale", () => {
  it("takes the phone's language under system, whatever followDevice says", () => {
    expect(startingLocale(BASE)).toBe(Locale.Ar);
    expect(startingLocale({ ...BASE, chosen: Locale.En })).toBe(Locale.Ar);
    expect(startingLocale({ ...BASE, deviceTags: ["tr-TR"] })).toBe(Locale.En);
  });

  it("takes the stored choice under in_app, then the phone only with followDevice", () => {
    const inApp = { ...BASE, mode: NativeSwitcher.InApp };
    expect(startingLocale({ ...inApp, chosen: Locale.En })).toBe(Locale.En);
    expect(startingLocale(inApp)).toBe(Locale.En);
    expect(startingLocale({ ...inApp, followDevice: true })).toBe(Locale.Ar);
  });

  it("ignores a stored choice that is no longer shipped", () => {
    expect(
      startingLocale({
        ...BASE,
        mode: NativeSwitcher.InApp,
        chosen: Locale.Fr,
        followDevice: true,
      }),
    ).toBe(Locale.Ar);
  });
});
