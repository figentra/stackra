/**
 * Stackra file contract:
 * Purpose: `sortChartItems`, a chart's categories in a `ChartSort` order: largest first, smallest first, or by label
 *          in the reader's alphabet (Arabic collation in Arabic). Bar rows, funnel steps and treemap tiles share it.
 * Boundary: pure; returns a new array and leaves the caller's alone. Equal values keep their given order.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same order on web and native); STA-1371.
 */
import type { ChartSort } from "#contracts/enums/chart-sort.enum";

/**
 * `items` in `sort` order, or as given when `sort` is left out.
 * @example sortChartItems([{ v: 1 }, { v: 3 }], "value-desc", (item) => item.v, () => "", "en"); // [{ v: 3 }, { v: 1 }]
 */
export function sortChartItems<T>(
  items: readonly T[],
  sort: ChartSort | undefined,
  valueOf: (item: T) => number,
  labelOf: (item: T) => string,
  locale: string,
): T[] {
  const copy = [...items];
  if (sort === undefined) return copy;
  if (sort === "label") {
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return copy.sort((a, b) => collator.compare(labelOf(a), labelOf(b)));
  }
  const sign = sort === "value-asc" ? 1 : -1;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return copy.sort((a, b) => sign * (valueOf(a) - valueOf(b)));
}
