/**
 * Stackra file contract:
 * Purpose: `permissionOf`, the permission of an action or query key: the key without its major
 *          (`orders.order.cancel@1` gives `orders.order.cancel`).
 * Boundary: internal to the ref factories; not exported from an entry. The permission is derived, never written
 *           (ADR 0294 decision 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0208 (permission names).
 */

/** A versioned or bare call key: dotted snake_case segments, then an optional `@<major>`. */
const CALL_KEY = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+(@\d+)?$/;

/**
 * The permission of `key`.
 *
 * @throws RangeError when `key` is not `<module>.<model>.<verb>` with an optional `@<major>`.
 * @example
 * permissionOf("catalogue.variant.get_by_barcode@1"); // "catalogue.variant.get_by_barcode"
 */
export function permissionOf(key: string): string {
  if (!CALL_KEY.test(key))
    throw new RangeError(
      `"${key}" is not a call key: dotted snake_case segments with an optional @<major>`,
    );
  return key.replace(/@\d+$/, "");
}
