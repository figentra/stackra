/**
 * Stackra file contract:
 * Purpose: `waffleCellsOf`, how many squares of a waffle chart each part gets: its share of `cells`, rounded by the
 *          largest remainder so the counts always add up to every square (or to none when the whole is zero).
 * Boundary: pure; a negative or non-finite value counts as zero. Ties go to the earlier part.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same numbers on web and native); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */

/**
 * Each part's number of squares.
 * @example waffleCellsOf([1, 1, 1], 100); // [34, 33, 33]
 */
export function waffleCellsOf(values: readonly number[], cells: number): readonly number[] {
  const clean = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const total = clean.reduce((sum, value) => sum + value, 0);
  if (total === 0 || cells <= 0) return clean.map(() => 0);
  const exact = clean.map((value) => (value / total) * cells);
  const counts = exact.map((value) => Math.floor(value));
  const left = cells - counts.reduce((sum, count) => sum + count, 0);
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order.slice(0, left)) counts[index] = (counts[index] ?? 0) + 1;
  return counts;
}
