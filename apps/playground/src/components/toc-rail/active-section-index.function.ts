/**
 * Stackra file contract:
 * Purpose: `activeSectionIndex`, the scroll spy's decision: of a page's section headings (their tops, in page order,
 *          measured from the viewport's top), the one the reader is at: the last whose top is above the activation
 *          line; the first when none is; the last at the very bottom of the page; the clicked one while a jump to it
 *          is under way. A small hysteresis keeps a heading resting on the line from flipping back and forth.
 * Boundary: pure; `useActiveSection` measures and calls it.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (scroll-spied TOC and section tabs).
 */
import type { ActiveSectionInput } from "#src/components/toc-rail/active-section-input.type";

/** The index of the active section. */
export function activeSectionIndex({
  tops,
  line,
  isAtBottom,
  previous,
  locked,
  hysteresis = 8,
}: ActiveSectionInput): number {
  if (locked !== undefined && locked >= 0 && locked < tops.length) return locked;
  let last = -1;
  tops.forEach((top, index) => {
    if (top !== undefined) last = index;
  });
  if (last < 0) return 0;
  if (isAtBottom) return last;
  let found = 0;
  tops.forEach((top, index) => {
    if (top !== undefined && top <= line) found = index;
  });
  if (previous === undefined || previous === found || previous >= tops.length) return found;
  // The heading whose crossing made the change must be past the line by more than the hysteresis.
  const crossing = found > previous ? tops[found] : tops[previous];
  if (crossing !== undefined && Math.abs(crossing - line) < hysteresis) return previous;
  return found;
}
