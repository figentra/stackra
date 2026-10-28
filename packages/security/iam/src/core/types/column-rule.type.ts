/**
 * Stackra file contract:
 * Purpose: `ColumnRule`, what one column of a view, report or export says about who may see it: the permission that
 *          reads it and the data class it holds.
 * Boundary: a type only, `hiddenColumns`' input. The permission is a locked key (`permissionKey` turns a static into
 *           one); the data class is a `DataClassification` code or a product data class key (ADR 0341).
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 6: columns carry visibility); ADR 0341 (data classes); ADR 0307 (rule 10).
 */

/** One column's visibility rule. */
export interface ColumnRule {
  /** The permission key a caller holds to see the column; absent when the column needs none. */
  readonly permission?: string;

  /** The data class the column holds; absent when it holds none. */
  readonly dataClass?: string;
}
