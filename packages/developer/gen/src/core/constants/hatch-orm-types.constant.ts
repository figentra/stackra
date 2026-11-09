/**
 * Stackra file contract:
 * Purpose: `HATCH_ORM_TYPES`, the ORM type the entity emitter gives a `@Field(zod)` hatch field from the Blueprint
 *          method of its migration column, so the ORM reads and writes the value the way the column holds it (a
 *          `t.enum()` or `t.string()` column holds the bare string, not its JSON encoding).
 * Boundary: data only. The values are the ORM types `emitEntities` already uses for the same kind of column
 *           (`string`, `integer`, `boolean`, `datetime`, `double` for a non-integer number, `json`). A method with no
 *           entry (`tsvector`, `point`, `polygon`, `line`) has no ORM type a hatch value fits, and
 *           `checkHatchColumns` refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the column type); ADR 0095 as amended by ADR 0294 (the hatch).
 */

/** The ORM type of a hatch field, by the Blueprint method that adds its column. */
export const HATCH_ORM_TYPES: Readonly<Record<string, string>> = {
  string: "string",
  enum: "string",
  uuid: "string",
  link: "string",
  integer: "integer",
  // shortcut: the ORM reads a bigint back as a string by default; a hatch value that is a bigint needs its own type.
  bigint: "bigint",
  // The emitter types a non-integer number `double`, which the ORM parses back to a number from a numeric column.
  decimal: "double",
  boolean: "boolean",
  timestamp: "datetime",
  jsonb: "json",
};
