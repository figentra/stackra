/**
 * Stackra file contract:
 * Purpose: proves `gradientColours` starts and ends on its stops, and `colourEscape` quantises a colour to each depth.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-016 and FR-020; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-016 sta-1730:FR-020
import { colourEscape } from "#core/functions/colour-escape.function";
import { gradientColours } from "#core/functions/gradient-colours.function";
import { renderBanner } from "#core/functions/render-banner.function";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";

describe("gradientColours", () => {
  it("runs from the first stop to the last", () => {
    const colours = gradientColours(["#ff0000", "#0000ff"], 5);
    expect(colours).toHaveLength(5);
    expect(colours[0]).toBe("#ff0000");
    expect(colours[4]).toBe("#0000ff");
  });

  it("handles one stop and no columns", () => {
    expect(gradientColours(["#123456"], 3)).toEqual(["#123456", "#123456", "#123456"]);
    expect(gradientColours(["#123456", "#abcdef"], 0)).toEqual([]);
  });
});

describe("colourEscape", () => {
  it.each([
    [24, "\u001B[38;2;255;0;0m"],
    [8, "\u001B[38;5;196m"],
    [4, "\u001B[31m"],
    [0, ""],
  ] as const)("writes red at depth %i", (depth, escape) => {
    expect(colourEscape("#ff0000", depth)).toBe(escape);
  });
});

describe("renderBanner", () => {
  it("colours the logo column by column and ends with the glyph, name and version", () => {
    const mode = { depth: 24, unicode: true } as const;
    const lines = renderBanner(STACKRA_THEME, "1.0.0", {
      ...mode,
      interactive: false,
      json: false,
      quiet: false,
      verbose: false,
      animate: true,
      tty: true,
      columns: 80,
    });
    expect(lines[2]).toContain("\u001B[38;2;");
    expect(lines.at(-2)).toContain("≡");
    expect(lines.at(-2)).toContain("1.0.0");
  });
});
