/**
 * Stackra file contract:
 * Purpose: unit tests of `symbolOf`: a square symbol answers its viewBox and inner markup; a missing or non-square
 *          viewBox, live text and active content are refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { symbolOf } from "#core/functions/symbol-of.function";
import { SYMBOL_SVG } from "#core/functions/__tests__/fixtures/kit.fixture";

describe("symbolOf", () => {
  it("reads the viewBox and the inner markup", () => {
    expect(symbolOf(SYMBOL_SVG, "s.svg")).toEqual({
      viewBox: [0, 0, 24, 24],
      body: '<path fill="currentColor" d="M2 2h20v20H2z"/>',
    });
  });

  it.each([
    ['<svg viewBox="0 0 24 12"><path d="M0 0"/></svg>', "the viewBox is not square"],
    ['<svg width="24"><path d="M0 0"/></svg>', "no usable viewBox on the <svg> element"],
    ['<svg viewBox="0 0 24 24"><text>A</text></svg>', "live <text> in the symbol (outline it)"],
    [
      '<svg viewBox="0 0 24 24" onload="x()"></svg>',
      "active content (script, foreignObject or an on* handler)",
    ],
  ])("refuses %s", (svg, problem) => {
    expect(() => symbolOf(svg, "s.svg")).toThrow(InvalidKitError);
    try {
      symbolOf(svg, "s.svg");
    } catch (error) {
      expect((error as InvalidKitError).problems).toContain(problem);
    }
  });
});
