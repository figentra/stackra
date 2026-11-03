/**
 * Stackra file contract:
 * Purpose: the dot loader's timing and sizes, shared by the web and native Spinner, ProgressBar, ProgressCircle and
 *   RouteProgress (STA-2017, brand rules §41).
 * Boundary: data only; the step maths is `dotLoaderLit` and `dotLoaderFilled`.
 * Runtime: any
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md
 */

/**
 * The dot loader: dots build the st tile's floors one whole step at a time, hold, then clear at once.
 * `cell` fills the Spinner contract's diameters (3 dots and 2 gaps: 16, 24 and 32 px).
 */
export const DOT_LOADER = Object.freeze({
  /** Milliseconds between two dots turning on. */
  dotMs: 80,
  /** Milliseconds the full build holds before it clears. */
  holdMs: 400,
  /** Milliseconds the cleared cell stays empty before the next build. */
  clearMs: 160,
  /** Opacity of an unlit dot, so the cell's shape stays visible. */
  unlitOpacity: 0.18,
  /** Opacity of the whole loader at rest under reduced motion. */
  reducedOpacity: 0.6,
  /** Dot and gap in pixels per size, for the 3×3 cell. */
  cell: Object.freeze({
    sm: Object.freeze({ dot: 4, gap: 2 }),
    md: Object.freeze({ dot: 6, gap: 3 }),
    lg: Object.freeze({ dot: 8, gap: 4 }),
  }),
  /** Dot and gap per size for ProgressCircle's 3×3 cell, at its contract diameters (20, 28 and 36 px). */
  circle: Object.freeze({
    sm: Object.freeze({ dot: 4, gap: 4 }),
    md: Object.freeze({ dot: 6, gap: 5 }),
    lg: Object.freeze({ dot: 8, gap: 6 }),
  }),
  /** Dots per ProgressBar size: a column of at least twice the dot at the bar's minimum width (10rem). */
  barDots: Object.freeze({ sm: 20, md: 16, lg: 10 }),
  /** The ProgressBar dot's side per size: the contract's track heights (4, 8 and 12 px). */
  barDot: Object.freeze({ sm: 4, md: 8, lg: 12 }),
});
