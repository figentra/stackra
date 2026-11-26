/**
 * Stackra file contract:
 * Purpose: `isMinorKey(key)`, whether a form key holds money in minor units: a `…Minor` field or a money object's
 *          `minor`.
 * Boundary: internal: pure; the web and native form fields enter such a number in major units once its currency is
 *           known.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units); ADR 0307.
 */

/**
 * Whether `key` holds minor units.
 *
 * @example
 * isMinorKey("totals.totalMinor"); // true
 */
export function isMinorKey(key: string): boolean {
  return key.endsWith("Minor") || key === "minor" || key.endsWith(".minor");
}
