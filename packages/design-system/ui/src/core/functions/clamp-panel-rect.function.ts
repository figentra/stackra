/**
 * Stackra file contract:
 * Purpose: `clampPanelRect(rect, viewport, shownHeight)`, a FloatingPanel's box kept inside the viewport: no wider or
 *          taller than the viewport, and moved back in so all of it shows (`shownHeight` is its drawn height, the
 *          header's alone when it is minimised).
 * Boundary: pure; physical pixels from the viewport's top-left corner.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** A panel's box in pixels. */
type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** The box moved and shrunk to fit inside the viewport. */
export function clampPanelRect(
  rect: Rect,
  viewport: { readonly width: number; readonly height: number },
  shownHeight: number = rect.height,
): Rect {
  const width = Math.min(rect.width, viewport.width);
  const height = Math.min(rect.height, viewport.height);
  const shown = Math.min(shownHeight, height);
  return {
    width,
    height,
    x: Math.min(Math.max(rect.x, 0), viewport.width - width),
    y: Math.min(Math.max(rect.y, 0), viewport.height - shown),
  };
}
