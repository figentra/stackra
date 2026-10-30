/**
 * Stackra file contract:
 * Purpose: proves `barHeaderOptions` gives iOS a clear scroll edge and, once scrolled, the theme's tinted glass over
 *          a blur of the content's tone (none when solid), with foreground text.
 * Boundary: the options only; react-native's Platform is a stand-in (iOS 26).
 * Runtime: node
 * Governing contract: owner decision 2026-10-28 (the top bar follows the theme); ADR 0022.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { OS: "ios", Version: "26.0" } }));

const { barHeaderOptions } = await import("../bar-header-options.function");

const BARS = {
  content: "light",
  background: "#5A1035",
  foreground: "#FFF0F5",
  tint: "#5A1035E0",
  isSolid: false,
} as const;

describe("barHeaderOptions", () => {
  it("tints the header with the theme's glass, clear at a large title's scroll edge only", () => {
    expect(barHeaderOptions(BARS).headerLargeStyle).toEqual({ backgroundColor: "#5A1035E0" });
    expect(barHeaderOptions(BARS, true)).toMatchObject({
      headerStyle: { backgroundColor: "#5A1035E0" },
      headerLargeStyle: { backgroundColor: "transparent" },
      headerBlurEffect: "systemThinMaterialDark",
      headerTintColor: "#FFF0F5",
      scrollEdgeEffects: { top: "hidden" },
    });
  });

  it("draws no blur when solid, and a light blur on a light theme", () => {
    expect(barHeaderOptions({ ...BARS, isSolid: true }).headerBlurEffect).toBe("none");
    expect(barHeaderOptions({ ...BARS, content: "dark" }).headerBlurEffect).toBe(
      "systemThinMaterialLight",
    );
  });
});
