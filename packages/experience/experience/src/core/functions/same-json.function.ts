/**
 * Stackra file contract:
 * Purpose: `sameJson(left, right)`, whether two JSON values are equal: by value, object keys in any order.
 * Boundary: internal; pure. `diffTheme` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 2).
 */

/**
 * Whether `left` and `right` hold the same JSON.
 *
 * @example
 * sameJson({ a: 1, b: [2] }, { b: [2], a: 1 }); // true
 */
export function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null)
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.hasOwn(right, key) &&
        sameJson((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
    )
  );
}
