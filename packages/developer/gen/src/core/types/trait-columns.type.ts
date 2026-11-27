/**
 * Stackra file contract:
 * Purpose: `TraitColumns`, what the migration macro of a model trait writes on the model's table, as `stackra db diff`
 *          expects it: the columns with their Postgres type and nullability, and the indexes with their access method.
 * Boundary: a type only. A column is `nullable: "either"` when the macro writes it not null on a new table and nullable
 *           on an existing one (`t.tree()`'s `tree_path` until its backfill); an index is `optional` when the macro
 *           writes it only on request (`t.metadata({ index: true })`, `t.partitionBy(column, { brin: false })`).
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decision 4: traits and the trait registry); ADR 0159 (the migration owns the schema);
 *                     ADR 0282 (decision 3: `stackra db diff`); STA-1408.
 */

/** The columns and indexes one trait's migration macro writes. */
export interface TraitColumns {
  /** The columns, in the order the macro writes them. */
  readonly columns: readonly {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean | "either";
  }[];

  /** The indexes, over the columns above or a column the trait's options name. */
  readonly indexes: readonly {
    readonly columns: readonly string[];
    readonly method: string;
    readonly optional?: true;
  }[];
}
