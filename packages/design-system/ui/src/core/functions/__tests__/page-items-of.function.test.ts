/**
 * Stackra file contract:
 * Purpose: proves `pageItemsOf` lists every page when they fit, keeps the first and last page, puts a gap only where
 *          more than one page is hidden, and keeps the same length while paging.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { pageItemsOf } from "#core/functions/page-items-of.function";

describe("pageItemsOf", () => {
  it("lists every page when they fit", () => {
    expect(pageItemsOf(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItemsOf(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("puts gaps around the current page", () => {
    expect(pageItemsOf(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });

  it("fills a gap of one page with the page itself at either end", () => {
    expect(pageItemsOf(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
    expect(pageItemsOf(20, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });

  it("keeps one length while paging, for any siblings", () => {
    for (let page = 1; page <= 40; page += 1) expect(pageItemsOf(page, 40, 2)).toHaveLength(9);
  });
});
