/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/theming: `useColorScheme`, `useAccessibility`,
 *          `AppearanceToggle` and `BrandLogo`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { useAccessibility } from "#react/accessibility/use-accessibility";
import { AppearanceToggle } from "#react/appearance-toggle/appearance-toggle";
import { BrandLogo } from "#react/brand-logo/brand-logo";
import { useColorScheme } from "#react/color-scheme/use-color-scheme";
import * as react from "#react/index";

describe("@stackra/theming/react", () => {
  it("exports exactly the hooks and the kit blocks", () => {
    expect(Object.keys(react).sort()).toEqual([
      "AppearanceToggle",
      "BrandLogo",
      "useAccessibility",
      "useColorScheme",
    ]);
    expect(react.AppearanceToggle).toBe(AppearanceToggle);
    expect(react.BrandLogo).toBe(BrandLogo);
    expect(react.useAccessibility).toBe(useAccessibility);
    expect(react.useColorScheme).toBe(useColorScheme);
  });
});
