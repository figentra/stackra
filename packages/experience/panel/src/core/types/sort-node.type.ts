/**
 * Stackra file contract:
 * Purpose: `SortNode`, a recorded sort: a row path and a direction.
 * Boundary: a type only; the table's default sort and a view's sort.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: sort is an enum of the sortable keys).
 */
import type { SortDirection } from "@stackra/contracts";

/** A sort key and its direction. */
export interface SortNode {
  /** The row path. */
  readonly key: string;

  /** Ascending or descending. */
  readonly direction: SortDirection;
}
