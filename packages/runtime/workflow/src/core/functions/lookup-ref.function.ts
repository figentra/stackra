/**
 * Stackra file contract:
 * Purpose: `lookupRef`, the value a reference path (`results.quote.total`) names in the document roots.
 * Boundary: internal and pure: it walks own properties only, so a path never reaches a prototype; a missing part is
 *           `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0154 (data, never an expression).
 */
import type { DocumentRoots } from "#core/types/document-roots.type";

/**
 * The value at `path` in `roots`.
 *
 * @example
 * lookupRef("input.orderId", { input: { orderId: "ord_1" }, results: {} }); // "ord_1"
 */
export function lookupRef(path: string, roots: DocumentRoots): unknown {
  let value: unknown = roots;
  for (const part of path.split(".")) {
    if (typeof value !== "object" || value === null || !Object.hasOwn(value, part))
      return undefined;
    value = (value as Readonly<Record<string, unknown>>)[part];
  }
  return value;
}
