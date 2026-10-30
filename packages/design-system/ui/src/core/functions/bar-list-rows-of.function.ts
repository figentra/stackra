/**
 * Stackra file contract:
 * Purpose: `barListRowsOf(items, sort, max)`, a BarList's rows in order with each bar's share of the full width
 *          (0 to 1), ranked by value unless `sort` is `none`.
 * Boundary: pure; negative values draw no bar, and a list of zeros draws empty bars rather than dividing by zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { BarListItem } from "#contracts/types/bar-list-item.type";

/** The rows with their shares. */
export function barListRowsOf(
  items: readonly BarListItem[],
  sort: "descending" | "none" = "descending",
  max?: number,
): readonly (BarListItem & { readonly share: number })[] {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const ordered = sort === "none" ? items : [...items].sort((a, b) => b.value - a.value);
  const full = max ?? Math.max(0, ...items.map((item) => item.value));
  return ordered.map((item) => ({
    ...item,
    share: full > 0 ? Math.min(1, Math.max(0, item.value / full)) : 0,
  }));
}
