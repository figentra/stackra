/**
 * Stackra file contract:
 * Purpose: `checkVector`, the one check every `VectorIndex` driver runs on a vector before it stores or queries it:
 *          at least one number, every one finite.
 * Boundary: pure; a trust boundary, since an embedding arrives from a model provider and a NaN would poison every
 *           distance. Internal: the drivers of this package call it, the entries do not export it.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (pgvector); owner decision 23.
 */

/**
 * Refuses a vector a driver cannot store or compare.
 *
 * @throws TypeError when `vector` is empty or holds a value that is not a finite number.
 * @example
 * checkVector([0.12, -0.4]); // passes
 */
export function checkVector(vector: readonly number[]): void {
  if (vector.length === 0) throw new TypeError("A vector needs at least one number");
  if (!vector.every((value) => typeof value === "number" && Number.isFinite(value)))
    throw new TypeError("A vector holds finite numbers only");
}
