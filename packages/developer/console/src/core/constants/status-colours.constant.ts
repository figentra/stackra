/**
 * Stackra file contract:
 * Purpose: `STATUS_COLOURS`, the colours of success, warning and error, the same in every product's CLI; only the
 *          accent, the gradient, the logo and the glyph come from a theme.
 * Boundary: `#rrggbb` values only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017.
 */

/** Status colours shared by every theme. */
export const STATUS_COLOURS = Object.freeze({
  /** Success marks and `DONE`. */
  success: "#3fb950",
  /** Warnings. */
  warning: "#d29922",
  /** Errors and `FAIL`. */
  error: "#f85149",
  /** Dim text, dots and rules. */
  muted: "#8b949e",
});
