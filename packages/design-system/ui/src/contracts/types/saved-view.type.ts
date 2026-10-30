/**
 * Stackra file contract:
 * Purpose: `SavedView`, one named query a `FilterPanel` offers as a tab ("Unpaid", "This week").
 * Boundary: types only; the app stores the views, the panel only lists and applies them.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0318; design-system gap inventory
 *          (2026-10-28) row 9.
 */
import type { ResourceQuery } from "#contracts/types/resource-query.type";

/** One saved view: a name and the whole query it applies. */
export interface SavedView {
  /** The key of the view; unique in the list. */
  readonly id: string;
  /** The name of the tab. */
  readonly label: string;
  /** The search, filters and sort the view applies when it is chosen. */
  readonly query: ResourceQuery;
}
