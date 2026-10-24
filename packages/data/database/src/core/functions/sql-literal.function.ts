/**
 * Stackra file contract:
 * Purpose: `sqlLiteral`, a column default or a comment as a Postgres literal: strings quoted with doubled quotes,
 *          numbers and booleans as written, `null`, and arrays or objects as `jsonb`.
 * Boundary: internal; only for the constant values a migration states (defaults, enum items, comments). Runtime
 *           values never pass through it: queries are parameterised (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0159 (literal, frozen migrations); ADR 0160 (parameterised runtime SQL).
 */

/**
 * The SQL literal of `value`.
 *
 * @throws TypeError for a number that is not finite, or a value of another type (a function, a symbol, `undefined`).
 * @example
 * sqlLiteral("it's"); // "'it''s'"
 * sqlLiteral([]); // "'[]'::jsonb"
 */
export function sqlLiteral(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${value} is not a SQL number`);
    return String(value);
  }
  if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
  if (typeof value === "object") return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
  throw new TypeError(`A ${typeof value} has no SQL literal`);
}
