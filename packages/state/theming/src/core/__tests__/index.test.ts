/**
 * Stackra file contract:
 * Purpose: pins the exports of the `.` entry of @stackra/theming: its values, `ColorScheme` as the one declared in
 *          `@stackra/ui/contracts`, the shipped schema under its generated name, and its public types.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); registry v3.1 Q6.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { ColorScheme } from "@stackra/ui/contracts";

import { THEMING_CONFIG_SCHEMA } from "#core/constants/theming-config-schema.constant";
import * as theming from "#core/index";
import type { ColorSchemeState, SchemeColors, Splash } from "#core/index";

describe("@stackra/theming", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(theming).sort()).toEqual([
      "ColorScheme",
      "ColorSchemeService",
      "MemorySystemAccessibilityDriver",
      "MemorySystemColorSchemeDriver",
      "ThemingConfig",
      "ThemingConfig$",
      "ThemingOptions",
    ]);
  });

  it("re-exports the one ColorScheme", () => {
    expect(theming.ColorScheme).toBe(ColorScheme);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(theming.ThemingConfig$).toBe(THEMING_CONFIG_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<ColorSchemeState["scheme"]>().toEqualTypeOf<"light" | "dark" | "system">();
    expectTypeOf<ColorSchemeState["resolved"]>().toEqualTypeOf<"light" | "dark">();
    expectTypeOf<SchemeColors>().toEqualTypeOf<{ readonly light: string; readonly dark: string }>();
    expectTypeOf<Splash["background"]>().toEqualTypeOf<SchemeColors>();
  });
});
