/**
 * Stackra file contract:
 * Purpose: unit tests of `barContentOn`: dark content on light colours and light content on dark ones, by lightness
 *          not by name (a light yellow, a dark pink, a mid grey either side of the turn), in every colour form a theme
 *          or Uniwind hands back, and the fallback for a colour it cannot read.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; owner decision 2026-10-28 (the bars follow the theme).
 */

import { barContentOn } from "#core/functions/bar-content-on.function";
import { barTint } from "#core/functions/bar-tint.function";

describe("barContentOn", () => {
  it.each([
    ["#FFFFFF", "dark"],
    ["#F9F7EE", "dark"],
    ["#FFF6B0", "dark"],
    ["#0B0D0F", "light"],
    ["#5A1035", "light"],
    ["#C2185B", "light"],
    ["#808080", "dark"],
    ["#666666", "light"],
  ] as const)("reads %s with %s content", (colour, content) => {
    expect(barContentOn(colour)).toBe(content);
  });

  it("reads every form a theme or Uniwind hands back", () => {
    expect(barContentOn("#fff")).toBe("dark");
    expect(barContentOn("#0B0D0FCC")).toBe("light");
    expect(barContentOn("rgb(249, 247, 238)")).toBe("dark");
    expect(barContentOn("rgba(11 13 15 / 0.9)")).toBe("light");
    expect(barContentOn("oklch(0.158 0.005 248)")).toBe("light");
    expect(barContentOn("oklch(0.97 0.06 100)")).toBe("dark");
  });

  it("falls back for a colour it cannot read", () => {
    expect(barContentOn("var(--background)")).toBe("dark");
    expect(barContentOn("transparent", "light")).toBe("light");
  });
});

describe("barTint", () => {
  it("writes the background at the share as #RRGGBBAA, whatever form it came in", () => {
    expect(barTint("#F9F7EE", 0.88)).toBe("#F9F7EEE0");
    expect(barTint("rgb(11, 13, 15)", 0.9)).toBe("#0B0D0FE6");
    expect(barTint("oklch(0.158 0.005 248)", 1)).toBe("#0B0D0FFF");
  });

  it("returns a colour it cannot read as given", () => {
    expect(barTint("var(--background)", 0.88)).toBe("var(--background)");
  });
});
