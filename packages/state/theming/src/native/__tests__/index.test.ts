/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./native` entry of @stackra/theming: the appearance and accessibility-info drivers.
 * Boundary: test only; react-native is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AccessibilityInfoSystemAccessibilityDriver } from "#native/drivers/accessibility-info-system-accessibility.driver";
import { AppearanceSystemColorSchemeDriver } from "#native/drivers/appearance-system-color-scheme.driver";
import * as native from "#native/index";

vi.mock("react-native", () => ({
  AccessibilityInfo: {},
  Appearance: {},
  Dimensions: {},
  PixelRatio: { getFontScale: () => 1 },
}));

describe("@stackra/theming/native", () => {
  it("exports exactly the native drivers", () => {
    expect(Object.keys(native).sort()).toEqual([
      "AccessibilityInfoSystemAccessibilityDriver",
      "AppearanceSystemColorSchemeDriver",
    ]);
    expect(native.AccessibilityInfoSystemAccessibilityDriver).toBe(
      AccessibilityInfoSystemAccessibilityDriver,
    );
    expect(native.AppearanceSystemColorSchemeDriver).toBe(AppearanceSystemColorSchemeDriver);
  });
});
