/**
 * Stackra file contract:
 * Purpose: `canonicalJson`, the one JSON text of a value that its content hash is taken over: object keys sorted at
 *          every depth, arrays in order, no whitespace.
 * Boundary: pure and internal (used by `contentHash`). Keys sort by UTF-16 code unit; properties whose value is
 *           `undefined` are left out, as `JSON.stringify` does.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */

/**
 * The canonical JSON of `value`.
 *
 * @example
 * canonicalJson({ b: 1, a: [2, 1] }); // '{"a":[2,1],"b":1}'
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, node: unknown) =>
    node !== null && typeof node === "object" && !Array.isArray(node)
      ? Object.fromEntries(
          Object.entries(node).sort(([left], [right]) =>
            left < right ? -1 : left > right ? 1 : 0,
          ),
        )
      : node,
  );
}
