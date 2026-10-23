/**
 * Stackra file contract:
 * Purpose: proves contrastRatio follows WCAG 2: the 21:1 and 1:1 ends, a known mid pair, symmetry and bad input.
 * Boundary: pure function; no DOM.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0022 (test placement).
 */
import { contrastRatio } from "#core/functions/contrast-ratio.function";

// @covers sta-350:FR-002
describe("contrastRatio", () => {
  it("spans 21:1 for black on white down to 1:1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBe(21);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("gives the WCAG ratio in either order", () => {
    // #767676 on white is the classic 4.54:1 grey.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#FFFFFF", "#767676")).toBe(contrastRatio("#767676", "#FFFFFF"));
  });

  it("refuses a translucent or malformed colour", () => {
    expect(() => contrastRatio("#0B0D0F66", "#FFFFFF")).toThrow(RangeError);
    expect(() => contrastRatio("#FFF", "#FFFFFF")).toThrow(RangeError);
  });
});
