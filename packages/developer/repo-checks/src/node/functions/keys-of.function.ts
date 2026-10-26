/**
 * Stackra file contract:
 * Purpose: `keysOf(catalogue)`, the dotted key of every message in a parsed lang catalogue.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0403; ADR 0305 (rule 1).
 */

/**
 * The dotted keys of `catalogue`.
 *
 * @param catalogue - a parsed lang file.
 * @param prefix - the path so far.
 * @example
 * keysOf({ a: { b: "x" } }); // ["a.b"]
 */
export function keysOf(catalogue: unknown, prefix = ""): string[] {
  if (typeof catalogue !== "object" || catalogue === null || Array.isArray(catalogue))
    return [prefix];
  return Object.entries(catalogue).flatMap(([key, value]) =>
    keysOf(value, prefix === "" ? key : `${prefix}.${key}`),
  );
}
