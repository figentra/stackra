/**
 * Stackra file contract:
 * Purpose: `resolveRefs`, a step's input with every reference (`{ "$ref": "input.orderId" }`) replaced by the value it
 *          names, at any depth.
 * Boundary: internal and pure. A reference to nothing becomes `undefined` (left out of the JSON the action receives);
 *           with `keepPending`, an unresolved `results.*` reference stays as it is, so a dry run shows what a later
 *           step will fill. Only an object whose one key is `$ref` with text is a reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0154.
 */
import { lookupRef } from "#core/functions/lookup-ref.function";
import { refOf } from "#core/functions/ref-of.function";
import type { DocumentRoots } from "#core/types/document-roots.type";

/**
 * `value` with its references resolved against `roots`.
 *
 * @example
 * resolveRefs({ to: { $ref: "input.phone" }, text: "Paid" }, { input: { phone: "+9665" }, results: {} });
 * // { to: "+9665", text: "Paid" }
 */
export function resolveRefs(value: unknown, roots: DocumentRoots, keepPending = false): unknown {
  const ref = refOf(value);
  if (ref !== undefined) {
    const found = lookupRef(ref, roots);
    return found === undefined && keepPending && ref.startsWith("results.") ? value : found;
  }
  if (Array.isArray(value)) return value.map((item) => resolveRefs(item, roots, keepPending));
  if (typeof value === "object" && value !== null)
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveRefs(item, roots, keepPending)]),
    );
  return value;
}
