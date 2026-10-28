/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./browser` entry of @stackra/theming: the two browser drivers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import { BrowserSystemAccessibilityDriver } from "#browser/drivers/browser-system-accessibility.driver";
import { BrowserSystemColorSchemeDriver } from "#browser/drivers/browser-system-color-scheme.driver";
import * as browser from "#browser/index";

describe("@stackra/theming/browser", () => {
  it("exports exactly the browser drivers", () => {
    expect(Object.keys(browser).sort()).toEqual([
      "BrowserSystemAccessibilityDriver",
      "BrowserSystemColorSchemeDriver",
    ]);
    expect(browser.BrowserSystemAccessibilityDriver).toBe(BrowserSystemAccessibilityDriver);
    expect(browser.BrowserSystemColorSchemeDriver).toBe(BrowserSystemColorSchemeDriver);
  });
});
