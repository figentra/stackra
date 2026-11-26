/**
 * Stackra file contract:
 * Purpose: `onColor(color)`, the text colour to put on a `#RRGGBB` fill: white or near-black (`#111111`), whichever
 *          contrasts more.
 * Boundary: pure. It picks; it does not judge whether the better one is good enough (that is
 *           `brandColorRefusals`).
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 (1.4.3 contrast); STA-2644.
 */
import { contrastRatio } from "@stackra/tokens";

/** White text. */
const WHITE = "#FFFFFF";

/** Near-black text: softer than pure black, still 18.9:1 on white. */
const NEAR_BLACK = "#111111";

/**
 * The better text colour on `color`; white on a tie.
 *
 * @throws RangeError when `color` is not `#RRGGBB`.
 * @example
 * onColor("#1D4ED8"); // "#FFFFFF"
 * onColor("#FACC15"); // "#111111"
 */
export function onColor(color: string): string {
  return contrastRatio(color, WHITE) >= contrastRatio(color, NEAR_BLACK) ? WHITE : NEAR_BLACK;
}
