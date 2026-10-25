/**
 * Stackra file contract:
 * Purpose: `mergeRanges`, sorted, non-overlapping millisecond ranges from any list of them: touching or overlapping
 *          ranges become one.
 * Boundary: internal; returns a new array and never mutates its input. Empty ranges are dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 5 and 7).
 */

/**
 * `ranges` sorted and merged.
 *
 * @example
 * mergeRanges([[5, 9], [0, 5]]); // [[0, 9]]
 */
export function mergeRanges(ranges: readonly (readonly [number, number])[]): [number, number][] {
  const sorted = ranges.filter(([start, end]) => start < end).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged.at(-1);
    if (last !== undefined && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
