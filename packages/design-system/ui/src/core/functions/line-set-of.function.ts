/**
 * Stackra file contract:
 * Purpose: `lineSetOf`, the line numbers a code block highlights: numbers and `"4-6"` ranges as one set.
 * Boundary: pure; a malformed entry is skipped.
 * Runtime: isomorphic
 * Governing contract: STA-1371.
 */

/** The set of lines in `lines` (`[2, "4-6"]` is 2, 4, 5 and 6). */
export function lineSetOf(lines: readonly (number | string)[] = []): Set<number> {
  const set = new Set<number>();
  for (const entry of lines) {
    const [from = Number.NaN, to = from] = String(entry).split("-").map(Number);
    for (let line = from; line <= to; line += 1) set.add(line);
  }
  return set;
}
