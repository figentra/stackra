/**
 * Stackra file contract:
 * Purpose: `messagesOf(catalogue)`, each message of a parsed lang catalogue by its dotted key.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0403; ADR 0305 (rule 1).
 */

/**
 * The messages of `catalogue` by dotted key.
 *
 * @param catalogue - a parsed lang file.
 * @param prefix - the path so far.
 * @example
 * messagesOf({ a: { b: "x" } }).get("a.b"); // "x"
 */
export function messagesOf(catalogue: unknown, prefix = ""): Map<string, unknown> {
  if (typeof catalogue !== "object" || catalogue === null || Array.isArray(catalogue))
    return new Map([[prefix, catalogue]]);
  return new Map(
    Object.entries(catalogue).flatMap(([key, value]) => [
      ...messagesOf(value, prefix === "" ? key : `${prefix}.${key}`),
    ]),
  );
}
