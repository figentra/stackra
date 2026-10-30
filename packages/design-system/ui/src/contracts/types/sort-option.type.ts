/**
 * Stackra file contract:
 * Purpose: `SortOption`, one column a `FilterPanel`'s sort menu offers.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0318; design-system gap inventory
 *          (2026-10-28) row 9.
 */

/** One sortable column of the sort menu. */
export interface SortOption {
  /** The `column` a `SortDescriptor` holds when this option is chosen. */
  readonly column: string;
  /** The name of the column in the menu. */
  readonly label: string;
}
