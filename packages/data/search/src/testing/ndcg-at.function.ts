/**
 * Stackra file contract:
 * Purpose: `ndcgAt`, the normalised discounted cumulative gain of a ranked id list at a cut-off, against graded
 *          relevance labels: 1 for the ideal order, 0 for nothing relevant found.
 * Boundary: pure, in the `./testing` entry. Gain is `2^grade - 1`, the discount `log2(position + 1)`; ids without a label
 *           grade 0; a list with no relevant label at all scores 0 (there is no ideal to reach).
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (enforcement: NDCG@10 of the fixed evaluation set); ADR 0221.
 */

/** The gain of `grade` at zero-based `position`. */
const gainAt = (grade: number, position: number): number =>
  (2 ** grade - 1) / Math.log2(position + 2);

/**
 * The NDCG of `ranked` at `k`.
 *
 * @param grades - the relevance grade of each id (0 none, 1 relevant, 2 best), by id.
 * @throws RangeError when `k` is not a whole number from 1.
 * @example
 * ndcgAt(["a", "b"], { a: 2, b: 1 }, 10); // 1
 */
export function ndcgAt(
  ranked: readonly string[],
  grades: Readonly<Record<string, number>>,
  k: number,
): number {
  if (!Number.isInteger(k) || k < 1) throw new RangeError(`k is a whole number from 1, got ${k}`);
  const dcg = ranked.slice(0, k).reduce((sum, id, at) => sum + gainAt(grades[id] ?? 0, at), 0);
  const ideal = Object.values(grades)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => b - a)
    .slice(0, k)
    .reduce((sum, grade, at) => sum + gainAt(grade, at), 0);
  return ideal === 0 ? 0 : dcg / ideal;
}
