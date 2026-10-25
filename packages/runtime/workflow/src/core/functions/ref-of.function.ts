/**
 * Stackra file contract:
 * Purpose: `refOf`, the path of a reference (`{ "$ref": "input.orderId" }`), or `undefined` for any other value.
 * Boundary: internal and pure. Only an object whose one key is `$ref` with text is a reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3).
 */

/**
 * The reference path of `value`.
 *
 * @example
 * refOf({ $ref: "results.quote.total" }); // "results.quote.total"
 * refOf({ $ref: "x", other: 1 }); // undefined
 */
export function refOf(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const ref = (value as { readonly $ref?: unknown }).$ref;
  return Object.keys(value).length === 1 && typeof ref === "string" ? ref : undefined;
}
