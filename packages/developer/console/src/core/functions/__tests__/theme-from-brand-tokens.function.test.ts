/**
 * Stackra file contract:
 * Purpose: proves `themeFromBrandTokens` reads the gradient and accent from a DTCG palette and refuses a missing or
 *          malformed token.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-017; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-017
import { themeFromBrandTokens } from "#core/functions/theme-from-brand-tokens.function";

const TOKENS = {
  palette: {
    "sky-500": { $value: "#1E88E5" },
    "sky-200": { $value: "#90CAF9" },
    bad: { $value: "blue" },
  },
};
const CHOICE = {
  name: "Runway",
  logo: ["RUNWAY"],
  glyph: "▲",
  asciiGlyph: "^",
  gradient: ["sky-500", "sky-200"],
  accent: "sky-500",
};

describe("themeFromBrandTokens", () => {
  it("reads the colours from the palette", () => {
    expect(themeFromBrandTokens(TOKENS, CHOICE)).toEqual({
      name: "Runway",
      logo: ["RUNWAY"],
      gradient: ["#1E88E5", "#90CAF9"],
      accent: "#1E88E5",
      glyph: "▲",
      asciiGlyph: "^",
    });
  });

  it.each(["missing", "bad"])("refuses the token %s", (accent) => {
    expect(() => themeFromBrandTokens(TOKENS, { ...CHOICE, accent })).toThrow(RangeError);
  });
});
