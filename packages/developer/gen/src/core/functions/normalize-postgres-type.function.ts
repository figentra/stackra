/**
 * Stackra file contract:
 * Purpose: `normalizePostgresType`, Postgres's `format_type` text in the short form the migrations and the type map use:
 *          `character varying(33)` is `varchar(33)`, `timestamp with time zone` is `timestamptz`, `character(3)` is
 *          `char(3)`, `numeric(12,2)` is `numeric(12, 2)`.
 * Boundary: pure; any other type passes through lowercased and trimmed.
 * Runtime: isomorphic
 * Governing contract: ADR 0159; STA-1808.
 */

/** The long names `format_type` prints, by their short form. */
const SHORT: ReadonlyMap<string, string> = new Map([
  ["timestamp with time zone", "timestamptz"],
  ["character varying", "varchar"],
  ["character", "char"],
]);

/**
 * The short form of `type`.
 *
 * @example
 * normalizePostgresType("character varying(33)"); // "varchar(33)"
 */
export function normalizePostgresType(type: string): string {
  const lower = type.trim().toLowerCase();
  const match = /^([a-z ]+?)(\((.*)\))?$/.exec(lower);
  if (match === null) return lower;
  const name = SHORT.get(match[1] ?? "") ?? match[1] ?? lower;
  const sizes = match[3];
  return sizes === undefined
    ? name
    : `${name}(${sizes
        .split(",")
        .map((part) => part.trim())
        .join(", ")})`;
}
