/**
 * Stackra file contract:
 * Purpose: `FacetOption`, one quick-filter chip of `SavedViews`: a value of a multi-select filter, its label and the
 *          count of records that have it.
 * Boundary: types only; the count is the app's (the server's facet), never computed here.
 * Runtime: isomorphic
 * Governing contract: ADR 0318; product audit 2026-10-28 (facet chips).
 */

/** One facet chip. */
export interface FacetOption {
  /** The value the chip adds to or removes from the facet's filter. */
  readonly id: string;
  /** The chip's text. */
  readonly label: string;
  /** How many records have the value; shown after the label when given. */
  readonly count?: number | undefined;
}
