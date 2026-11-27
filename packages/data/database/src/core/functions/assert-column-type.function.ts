/**
 * Stackra file contract:
 * Purpose: `assertColumnType(column, type)`, which refuses a SQL type the blueprint does not write, for every step that
 *          states a column's type as a literal: a type change (`t.change().type`), a dropped column and a renamed one.
 * Boundary: pure; the list is the blueprint's own column types, so a frozen inverse never names a type the compiler
 *           could not have written.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (literal snapshots; gen derives every inverse).
 */

/** The SQL types a blueprint writes. */
const SQL_TYPE =
  /^(text|integer|bigint|boolean|timestamptz|uuid|jsonb|tsvector|tstzrange|ltree|geography\((Point|Polygon|LineString),4326\)|varchar\([1-9]\d{0,7}\)|char\([1-9]\d{0,7}\)|numeric\([1-9]\d{0,3}, \d{1,4}\))$/;

/**
 * Refuses a type the blueprint does not write.
 *
 * @throws TypeError naming the column and the type.
 * @example
 * assertColumnType("note", "varchar(200)"); // passes
 */
export function assertColumnType(column: string, type: string): void {
  if (typeof type !== "string" || !SQL_TYPE.test(type))
    throw new TypeError(`${column}: "${type}" is not a column type a blueprint writes`);
}
