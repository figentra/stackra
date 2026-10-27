/**
 * Stackra file contract:
 * Purpose: `valueAt`, the value at a dotted path of a parsed payload (`obj.order.id`), or `undefined` when a step is
 *          missing or not an object.
 * Boundary: internal; the receiver reads the event type and id with it, and the field schemes read their token, their
 *           signature and their signed fields. Never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15).
 */

/**
 * The value at `path`.
 *
 * @example
 * valueAt({ obj: { id: 7 } }, "obj.id"); // 7
 */
export function valueAt(payload: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined,
      payload,
    );
}
