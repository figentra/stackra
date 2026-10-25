/**
 * Stackra file contract:
 * Purpose: `compareVersions`, the order of two `major.minor.patch` pack versions, for picking the highest version a pin
 *          allows.
 * Boundary: pure and internal; the versions are already checked by `MarketPack$`.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 4).
 */

/**
 * Negative when `left` is older, positive when newer, zero when equal.
 *
 * @example
 * compareVersions("2.10.0", "2.9.3"); // > 0
 */
export function compareVersions(left: string, right: string): number {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let part = 0; part < 3; part += 1)
    if (a[part] !== b[part]) return (a[part] ?? 0) - (b[part] ?? 0);
  return 0;
}
