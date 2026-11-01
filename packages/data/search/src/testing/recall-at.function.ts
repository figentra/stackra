/**
 * Stackra file contract:
 * Purpose: `recallAt`, the share of a query's relevant ids found in the first `k` of a ranked list.
 * Boundary: pure, in the `./testing` entry. An id is relevant when its grade is above 0; a query with no relevant id has
 *           nothing to miss, so its recall is 1.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (enforcement: recall@50 of the fixed evaluation set); ADR 0221.
 */

/**
 * The recall of `ranked` at `k`.
 *
 * @param grades - the relevance grade of each id, by id.
 * @throws RangeError when `k` is not a whole number from 1.
 * @example
 * recallAt(["a", "x"], { a: 2, b: 1 }, 50); // 0.5
 */
export function recallAt(
  ranked: readonly string[],
  grades: Readonly<Record<string, number>>,
  k: number,
): number {
  if (!Number.isInteger(k) || k < 1) throw new RangeError(`k is a whole number from 1, got ${k}`);
  const relevant = Object.entries(grades)
    .filter(([, grade]) => grade > 0)
    .map(([id]) => id);
  if (relevant.length === 0) return 1;
  const found = new Set(ranked.slice(0, k));
  return relevant.filter((id) => found.has(id)).length / relevant.length;
}
