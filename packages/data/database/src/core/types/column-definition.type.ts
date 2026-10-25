/**
 * Stackra file contract:
 * Purpose: `ColumnDefinition`, the chain one blueprint column returns: `t.string("sku", 64).notNull().comment(...)`.
 * Boundary: a type only; the migration compiler records the calls and writes the SQL. Every column states its
 *           nullability and carries a comment taken from the model field's docblock, or compiling fails.
 * Runtime: node
 * Governing contract: ADR 0159 (migrations, as amended by ADR 0305); ADR 0014 (decision 6: generated columns).
 */

/** One column of a blueprint. */
export interface ColumnDefinition {
  /** The column refuses null. On an existing table it also needs a `default`, or the step would fail on its rows. */
  notNull(): this;

  /** The column accepts null. */
  nullable(): this;

  /** The column's comment: the model field's docblock, written as `COMMENT ON COLUMN`. */
  comment(text: string): this;

  /** The default, a constant equal to the model field's initializer; an array or object is stored as jsonb. */
  default(value: string | number | boolean | null | object): this;

  /** A plain index on the column alone (`idx_<table>_<column>`); built online when the table already exists. */
  index(): this;

  /**
   * Compares and sorts the text column by `collation`, an ICU collation the module's migration created with
   * `schema.createCollation` (Arabic letter order, digits by value). Text columns only.
   */
  collate(collation: string): this;

  /** A persisted computed value: `GENERATED ALWAYS AS (<expression>) STORED`; the model reads it with a getter. */
  storedAs(expression: string): this;
}
