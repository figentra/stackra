/**
 * Stackra file contract:
 * Purpose: `sorted(items, compare?)`, a sorted copy of any iterable: `Array.prototype.toSorted` for the ES2022 lib the
 *          CLI builds against, so the repository commands moved from `tools/scripts` keep their order unchanged.
 * Boundary: pure; never touches its input.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the repository scripts move into the CLI).
 */

/**
 * A new array holding `items` in order, the same order `toSorted` gives.
 *
 * @param items - what to sort; left as it was.
 * @param compare - the comparator; UTF-16 string order when absent.
 * @example
 * sorted(new Set(["b", "a"])); // ["a", "b"]
 */
export function sorted<T>(items: Iterable<T>, compare?: (left: T, right: T) => number): T[] {
  const copy = [...items];
  copy.sort(compare);
  return copy;
}
