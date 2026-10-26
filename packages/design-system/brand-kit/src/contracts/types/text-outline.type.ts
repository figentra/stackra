/**
 * Stackra file contract:
 * Purpose: `TextOutline`, a line of text as SVG path data: every glyph outlined, baseline at y = 0 and origin at
 *          x = 0, with its bounding box and advance width in the same units.
 * Boundary: type only. A logo or caption never carries live `<text>`; it carries this.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5), ADR 0340 decision 10 (the outliner).
 */

/** One outlined line. */
export interface TextOutline {
  /** SVG path data, y down. */
  readonly d: string;

  /** The ink's bounding box. */
  readonly box: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };

  /** The advance width of the whole line. */
  readonly advance: number;
}
