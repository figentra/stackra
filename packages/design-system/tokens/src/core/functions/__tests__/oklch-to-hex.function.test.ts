/**
 * Stackra file contract:
 * Purpose: proves oklchToHex gives the sRGB a browser paints: the white and black points, colours Chromium rendered
 *          for the stackra theme (within one step per channel), gamut clipping, alpha and bad input.
 * Boundary: pure function; no DOM.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0022 (test placement).
 */
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

/** The largest difference between two hex colours in any one channel. */
const channelGap = (one: string, two: string) =>
  Math.max(
    ...[1, 3, 5].map((start) =>
      Math.abs(
        Number.parseInt(one.slice(start, start + 2), 16) -
          Number.parseInt(two.slice(start, start + 2), 16),
      ),
    ),
  );

// @covers sta-350:FR-002
describe("oklchToHex", () => {
  it("maps the white and black points exactly", () => {
    expect(oklchToHex("oklch(1 0 0)")).toBe("#FFFFFF");
    expect(oklchToHex("oklch(0 0 0)")).toBe("#000000");
  });

  it("matches the colours Chromium painted for the theme, within one step per channel", () => {
    for (const [oklch, painted] of [
      ["oklch(0.195 0.006 250)", "#131518"], // dark surface
      ["oklch(0.5 0.13 135)", "#40731A"], // light success
      ["oklch(0.972 0.004 122)", "#F5F6F3"], // paper
      ["oklch(0.158 0.005 248)", "#0B0D0F"], // ink
    ] as const)
      expect(channelGap(oklchToHex(oklch), painted), oklch).toBeLessThanOrEqual(1);
  });

  it("clips an out-of-gamut colour to sRGB", () => {
    expect(oklchToHex("oklch(0.7 0.4 30)")).toMatch(/^#FF00[0-9A-F]{2}$/);
  });

  it("appends the alpha as a fourth byte", () => {
    expect(oklchToHex("oklch(0.158 0.005 248 / 0.4)")).toBe("#0B0D0F66");
  });

  it("refuses anything but oklch(L C H [/ A])", () => {
    expect(() => oklchToHex("#FFFFFF")).toThrow(RangeError);
    expect(() => oklchToHex("oklch(50% 0.1 120)")).toThrow(RangeError);
  });
});
