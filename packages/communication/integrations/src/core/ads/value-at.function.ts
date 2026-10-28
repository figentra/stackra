/**
 * Stackra file contract:
 * Purpose: `valueAt(payload, path)`, the value at a dotted path (`customer.email`) of an event payload, for the
 *          conversion bridge's `Conversion` paths.
 * Boundary: pure and internal (not in a barrel); own properties of plain objects only, so a path never reaches a
 *           prototype. Anything missing on the way is `undefined`.
 * Runtime: isomorphic
 * Governing contract: analytics gap 12 (stackra-412).
 */

/**
 * The value at dotted `path` of `payload`, or `undefined`.
 *
 * @example
 * valueAt({ customer: { email: "a@b.example" } }, "customer.email"); // "a@b.example"
 */
export function valueAt(payload: unknown, path: string): unknown {
  let value = payload;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
