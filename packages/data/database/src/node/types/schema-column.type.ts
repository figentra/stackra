/**
 * Stackra file contract:
 * Purpose: `SchemaColumn`, one column of a `SchemaTable`: its name, type, nullability and default.
 * Boundary: a type only; plain JSON values.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2906.
 */

/** One column of a table. */
export interface SchemaColumn {
  /** The column name. */
  readonly name: string;
  /** Its type as Postgres formats it (`character varying(33)`, `timestamp with time zone`). */
  readonly type: string;
  /** Whether it accepts null. */
  readonly nullable: boolean;
  /** Its default expression, or null. */
  readonly default: string | null;
}
