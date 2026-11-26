/**
 * Stackra file contract:
 * Purpose: `plainText(value)`, a resource value as plain text: empty for nothing, a date in the viewer's locale, an
 *          object by its `name` (a principal) or as JSON, anything else as typed.
 * Boundary: internal: pure; the resource values of both entries show it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164.
 */

/**
 * Plain text of `value`.
 *
 * @example
 * plainText({ id: "usr_1", name: "Sara" }); // "Sara"
 */
export function plainText(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") {
    const named = (value as { readonly name?: unknown }).name;
    return typeof named === "string" ? named : JSON.stringify(value);
  }
  return String(value as string | number | bigint);
}
