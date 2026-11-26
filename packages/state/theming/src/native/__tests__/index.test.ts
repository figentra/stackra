/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./native` entry of @stackra/theming: the appearance and accessibility-info drivers
 *          and the BrandLogo block.
 * Boundary: test only; react-native is mocked, and `@stackra/ui/native` is replaced by an empty stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BrandLogo } from "#native/brand-logo/brand-logo";
import { AccessibilityInfoSystemAccessibilityDriver } from "#native/drivers/accessibility-info-system-accessibility.driver";
import { AppearanceSystemColorSchemeDriver } from "#native/drivers/appearance-system-color-scheme.driver";
import * as native from "#native/index";

vi.mock("react-native", () => ({
  AccessibilityInfo: {},
  Appearance: {},
  Dimensions: {},
  PixelRatio: { getFontScale: () => 1 },
}));

vi.mock("@stackra/ui/native", () => ({ Thumbnail: () => null }));

describe("@stackra/theming/native", () => {
  it("exports exactly the native drivers and the kit block", () => {
    expect(Object.keys(native).sort()).toEqual([
      "AccessibilityInfoSystemAccessibilityDriver",
      "AppearanceSystemColorSchemeDriver",
      "BrandLogo",
    ]);
    expect(native.BrandLogo).toBe(BrandLogo);
    expect(native.AccessibilityInfoSystemAccessibilityDriver).toBe(
      AccessibilityInfoSystemAccessibilityDriver,
    );
    expect(native.AppearanceSystemColorSchemeDriver).toBe(AppearanceSystemColorSchemeDriver);
  });
});
