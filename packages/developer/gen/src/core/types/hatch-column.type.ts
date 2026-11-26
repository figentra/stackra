/**
 * Stackra file contract:
 * Purpose: `HatchColumn`, the migration column a `@Field(zod)` hatch field is stored in: its table, column name, the
 *          Blueprint method that adds it and the migration file (`hatchColumnOf`).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the column type).
 */

/** The column a hatch field is stored in. */
export interface HatchColumn {
  /** The schema-qualified table, `venues.closures`. */
  readonly table: string;

  /** The column name, `closed_on`. */
  readonly column: string;

  /** The Blueprint method that adds it, `string`. */
  readonly method: string;

  /** The migration file that adds it, relative to the member root. */
  readonly file: string;
}
