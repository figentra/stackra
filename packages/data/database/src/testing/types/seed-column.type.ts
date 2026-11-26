/**
 * Stackra file contract:
 * Purpose: `SeedColumn`, a column's type as the catalogue gives it, for `seedValue`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decision 5).
 */

/** A column's type as the catalogue gives it. */
export interface SeedColumn {
  /** `format_type(...)`: `character varying(33)`, `bigint`. */
  readonly type: string;
  /** `pg_type.typcategory`: `S` string, `N` numeric, `D` date and time, `U` user-defined. */
  readonly category: string;
  /** `pg_type.typname`: `uuid`, `varchar`. */
  readonly typeName: string;
}
