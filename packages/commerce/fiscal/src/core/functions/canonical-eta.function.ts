/**
 * Stackra file contract:
 * Purpose: `canonicalEta`, the serialization the Egyptian e-invoicing system signs: every property name upper-cased
 *          and quoted, every scalar quoted, an array's name written once and then again before each element.
 * Boundary: a pure function over JSON-shaped data; `undefined` properties are skipped, as JSON drops them.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/**
 * The text whose SHA-256 the issuer seals.
 *
 * @example
 * canonicalEta({ a: 1, b: [{ c: "x" }] }); // '"A""1""B""B""C""x"'
 */
export function canonicalEta(value: unknown): string {
  if (value === null || typeof value !== "object")
    return `"${value === null ? "" : String(value)}"`;
  let out = "";
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    const name = `"${key.toUpperCase()}"`;
    if (Array.isArray(child)) {
      out += name;
      for (const element of child) out += name + canonicalEta(element);
    } else out += name + canonicalEta(child);
  }
  return out;
}
