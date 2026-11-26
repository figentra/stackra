/**
 * Stackra file contract:
 * Purpose: unit tests of `onColor`: white on a dark fill, near-black (`#111111`) on a light one.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; WCAG 2.2 (1.4.3).
 */
import { describe, expect, it } from "@stackra/testing";

import { onColor } from "#core/functions/on-color.function";

/** The text colour on a fill. */
describe("onColor", () => {
  /** Dark fills take white. */
  it("is white on a dark fill", () => {
    expect(onColor("#000000")).toBe("#FFFFFF");
    expect(onColor("#1D4ED8")).toBe("#FFFFFF");
  });

  /** Light fills take near-black. */
  it("is near-black on a light fill", () => {
    expect(onColor("#FFFFFF")).toBe("#111111");
    expect(onColor("#FACC15")).toBe("#111111");
  });
});
