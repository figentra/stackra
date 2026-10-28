/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./contracts` entry of @stackra/theming: the `SystemColorScheme` and `SystemAccessibility` ports
 *          and the default accessibility settings.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DEFAULT_ACCESSIBILITY_SETTINGS } from "#contracts/constants/default-accessibility-settings.constant";
import * as contracts from "#contracts/index";
import type { AccessibilitySettings } from "#contracts/index";
import { SystemAccessibility } from "#contracts/ports/system-accessibility.port";
import { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";

describe("@stackra/theming/contracts", () => {
  it("exports exactly the ports and the default settings", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "DEFAULT_ACCESSIBILITY_SETTINGS",
      "SystemAccessibility",
      "SystemColorScheme",
    ]);
    expect(contracts.SystemColorScheme).toBe(SystemColorScheme);
    expect(contracts.SystemAccessibility).toBe(SystemAccessibility);
    expect(contracts.DEFAULT_ACCESSIBILITY_SETTINGS).toBe(DEFAULT_ACCESSIBILITY_SETTINGS);
  });

  it("defaults to no setting and a font scale of 1, frozen", () => {
    expect(DEFAULT_ACCESSIBILITY_SETTINGS).toEqual({
      reduceMotion: false,
      boldText: false,
      highContrast: false,
      fontScale: 1,
    });
    expect(Object.isFrozen(DEFAULT_ACCESSIBILITY_SETTINGS)).toBe(true);
    expectTypeOf<keyof AccessibilitySettings>().toEqualTypeOf<
      "reduceMotion" | "boldText" | "highContrast" | "fontScale"
    >();
  });
});
