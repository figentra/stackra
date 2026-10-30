/**
 * Stackra file contract:
 * Purpose: `StudioView`: how the studio canvas is drawn: the device (desktop, iPad, iPhone, Android phone), its
 *          orientation, the zoom, and light and dark side by side.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0305 (rule 12).
 */

/** How the canvas is drawn. */
export interface StudioView {
  /** The device the template is drawn in. */
  readonly device: "desktop" | "tablet" | "iphone" | "android";
  /** True to turn a tablet or phone on its side (the desktop ignores it). */
  readonly isLandscape: boolean;
  /** Fit the whole device to the canvas, or a set scale in percent. */
  readonly zoom: "fit" | "50" | "75" | "100";
  /** True to draw the template twice, light and dark. */
  readonly isSideBySide: boolean;
}
