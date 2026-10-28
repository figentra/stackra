/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/theming: `useColorScheme` and `useAccessibility`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { useAccessibility } from "#react/accessibility/use-accessibility";
import { useColorScheme } from "#react/color-scheme/use-color-scheme";
import * as react from "#react/index";

describe("@stackra/theming/react", () => {
  it("exports exactly the hooks", () => {
    expect(Object.keys(react).sort()).toEqual(["useAccessibility", "useColorScheme"]);
    expect(react.useAccessibility).toBe(useAccessibility);
    expect(react.useColorScheme).toBe(useColorScheme);
  });
});
