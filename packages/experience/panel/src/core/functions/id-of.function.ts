/**
 * Stackra file contract:
 * Purpose: `idOf(record)`, the public id of a resource row or record as a string, the key a row action, a bulk
 *          selection and a page link carry.
 * Boundary: internal; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (`:id` is the record's public id).
 */

/**
 * The id of `record`.
 *
 * @example
 * idOf({ id: "ord_1" }); // "ord_1"
 */
export function idOf(record: object): string {
  return String((record as { readonly id?: unknown }).id);
}
