/**
 * Stackra file contract:
 * Purpose: proves `localeForDirection` keeps a locale that already reads in the direction and otherwise adds a script
 *          of that direction, keeping the region.
 * Boundary: pure function; Node's Intl.
 * Runtime: node
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
import { localeForDirection } from "#core/functions/locale-for-direction.function";

describe("localeForDirection", () => {
  it("keeps a locale that already reads that way", () => {
    expect(localeForDirection("ar-SA", "rtl")).toBe("ar-SA");
    expect(localeForDirection("en", "ltr")).toBe("en");
  });

  it("adds a script of the direction, keeping the region", () => {
    expect(localeForDirection("ar-SA", "ltr")).toBe("ar-Latn-SA");
    expect(localeForDirection("en-US", "rtl")).toBe("en-Arab-US");
  });
});
