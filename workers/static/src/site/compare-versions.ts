/**
 * Stackra file contract:
 * Purpose: order two plain `major.minor.patch` versions numerically, for sorting releases and picking the newest
 *          release of each major.
 * Boundary: pure; assumes versions already validated by read-schema-releases.ts.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 3).
 */

/**
 * Compare two `x.y.z` versions part by part as numbers, so `1.10.0` sorts after `1.9.0` (a string sort would not).
 *
 * @param left - a validated version.
 * @param right - a validated version.
 * @returns a negative number when `left` is older, positive when newer, 0 when equal; usable as a sort comparator.
 */
export function compareVersions(left: string, right: string): number {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return (a[i] ?? 0) - (b[i] ?? 0);
  return 0;
}
