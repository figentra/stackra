/**
 * Stackra file contract:
 * Purpose: `isNearBottom`, whether a scroll position is at the bottom of its content, within a small slack so a
 *          fraction of a pixel or the last few points still count: the MessageScroller sticks while it is true.
 * Boundary: pure; the web passes `scrollTop`, `scrollHeight` and `clientHeight`, native the content offset, the
 *           content height and the viewport height.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** How far from the bottom, in pixels or points, still counts as the bottom. */
const SLACK = 24;

/** True when the scroll position is within the slack of the bottom. */
export function isNearBottom(
  offset: number,
  contentHeight: number,
  viewportHeight: number,
): boolean {
  return contentHeight - offset - viewportHeight <= SLACK;
}
