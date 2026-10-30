/**
 * Stackra file contract:
 * Purpose: how many of a toolbar's measured buttons fit a width, leaving room for the "more" button when some do not,
 *          so the web and native OverflowToolbar agree on what overflows.
 * Boundary: pure; widths in any one unit (CSS px on web, points on native).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory row 33 (2026-10-28).
 */

/**
 * The number of leading buttons that fit.
 * @param widths - each button's width, in priority order
 * @param available - the row's width
 * @param moreWidth - the "more" button's width
 * @param gap - the space between two buttons
 * @returns `widths.length` when all fit, else the most that fit beside the "more" button (possibly 0)
 */
export function overflowFitCount(
  widths: readonly number[],
  available: number,
  moreWidth: number,
  gap: number,
): number {
  const total = widths.reduce((sum, width, index) => sum + width + (index > 0 ? gap : 0), 0);
  if (total <= available) return widths.length;
  let used = moreWidth;
  let count = 0;
  for (const width of widths) {
    used += width + gap;
    if (used > available) break;
    count += 1;
  }
  return count;
}
