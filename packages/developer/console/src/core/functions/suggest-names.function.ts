/**
 * Stackra file contract:
 * Purpose: `suggestNames(typed, names)`, up to three registered names within edit distance 2 of what was typed,
 *          nearest first, for "Did you mean ...?".
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-011; spec 030 Requirement 4.6.
 */

/** The Levenshtein distance between `a` and `b`. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++)
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** Up to three of `names` within distance 2 of `typed`, nearest first, then by name. */
export function suggestNames(typed: string, names: Iterable<string>): string[] {
  return [...new Set(names)]
    .map((name) => ({ name, cost: distance(typed, name) }))
    .filter(({ cost }) => cost <= 2)
    .toSorted((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(({ name }) => name);
}
