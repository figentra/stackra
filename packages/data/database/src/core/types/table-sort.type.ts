/**
 * Stackra file contract:
 * Purpose: `TableSort`, one key of a table read's sort: a dotted model path and a direction.
 * Boundary: a type only. `TableQuery.sort` takes one, or a list of them for a multi-key sort (first key first).
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: sort is an enum of the sortable keys).
 */
import type { SortDirection } from "@stackra/contracts";

/** One sort key and its direction. */
export interface TableSort {
  /** The dotted model path. */
  readonly key: string;

  /** Ascending or descending. */
  readonly direction: SortDirection;
}
