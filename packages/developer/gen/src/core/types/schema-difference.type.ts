/**
 * Stackra file contract:
 * Purpose: `SchemaDifference`, one place where the models and the migrations disagree: the module, the table, the
 *          kind of disagreement, what it is about, and what each side holds.
 * Boundary: a type only. `expected` is the model's side and `actual` the migrations' side, each `-` when the side has
 *           nothing (a missing table has no actual).
 * Runtime: isomorphic
 * Governing contract: ADR 0159; ADR 0282 (decision 3: `stackra db diff`); STA-1808.
 */
/** One place where the models and the migrations disagree. */
export interface SchemaDifference {
  /** The module key, which is the Postgres schema. */
  readonly module: string;

  /** The table, without its schema. */
  readonly table: string;

  /**
   * What differs: `missing_table` and `undeclared_table` (a model with no table; a table with no model),
   * `missing_column` and `undeclared_column`, `nullability`, `column_type`, `type_unmapped` (the field type has no
   * Postgres mapping, so its column type is not checked), `missing_index` and `undeclared_index`, `index_shape`
   * (same name, different columns, uniqueness or predicate), `missing_foreign_key` and `undeclared_foreign_key`.
   */
  readonly kind:
    | "missing_table"
    | "undeclared_table"
    | "missing_column"
    | "undeclared_column"
    | "nullability"
    | "column_type"
    | "type_unmapped"
    | "missing_index"
    | "undeclared_index"
    | "index_shape"
    | "missing_foreign_key"
    | "undeclared_foreign_key";

  /** The column, index or foreign key name; the table name for a table. */
  readonly subject: string;

  /** What the models declare, or `-`. */
  readonly expected: string;

  /** What the migrations build, or `-`. */
  readonly actual: string;
}
