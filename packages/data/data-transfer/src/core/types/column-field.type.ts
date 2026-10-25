/**
 * Stackra file contract:
 * Purpose: `ColumnField`, a target field as `matchColumns` sees it: its name and the labels a header may use for it.
 * Boundary: a type only. The labels come from the model's field labels in every locale the tenant uses.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */

/** A field to match a column to. */
export interface ColumnField {
  /** The field name (`sku`). */
  readonly name: string;

  /** Its labels (`SKU`, `رمز المنتج`). */
  readonly labels: readonly string[];
}
