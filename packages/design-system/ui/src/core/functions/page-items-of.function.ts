/**
 * Stackra file contract:
 * Purpose: `pageItemsOf(page, pageCount, siblings)`, the numbered pages a Pagination shows: the first and last page,
 *          the current one with `siblings` either side, and `"ellipsis"` for each gap of more than one page.
 * Boundary: pure; pages count from 1. The list never changes length while paging past the middle, so the buttons
 *           do not jump under the pointer.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { PageItem } from "#core/types/page-item.type";

/**
 * The pages to show.
 * @param page - the current page, from 1
 * @param pageCount - how many pages there are
 * @param siblings - pages shown either side of the current one
 */
export function pageItemsOf(page: number, pageCount: number, siblings = 1): readonly PageItem[] {
  const slots = siblings * 2 + 5;
  if (pageCount <= slots) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const start = Math.min(Math.max(page - siblings, 3), pageCount - siblings * 2 - 2);
  const end = start + siblings * 2;
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  return [
    1,
    start > 3 ? "ellipsis" : 2,
    ...middle,
    end < pageCount - 2 ? "ellipsis" : pageCount - 1,
    pageCount,
  ];
}
