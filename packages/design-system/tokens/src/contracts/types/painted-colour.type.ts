/**
 * Stackra file contract:
 * Purpose: a colour as the browser paints it: 8-bit sRGB channels and an alpha, so a translucent fill can be composited
 *          over what lies under it before its contrast is measured.
 * Boundary: types only; `paintedColour` makes one.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4).
 */

/** An sRGB colour, 0 to 255 per channel (unrounded), with its alpha from 0 to 1. */
export interface PaintedColour {
  /** Red, green and blue, 0 to 255. */
  readonly rgb: readonly [number, number, number];
  /** 0 (clear) to 1 (opaque). */
  readonly alpha: number;
}
