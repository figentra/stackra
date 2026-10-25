/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./browser` entry of @stackra/theming: the browser driver only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import { BrowserSystemColorSchemeDriver } from "#browser/drivers/browser-system-color-scheme.driver";
import * as browser from "#browser/index";

describe("@stackra/theming/browser", () => {
  it("exports exactly the browser driver", () => {
    expect(Object.keys(browser)).toEqual(["BrowserSystemColorSchemeDriver"]);
    expect(browser.BrowserSystemColorSchemeDriver).toBe(BrowserSystemColorSchemeDriver);
  });
});
