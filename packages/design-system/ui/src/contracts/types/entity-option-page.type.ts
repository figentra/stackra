/**
 * Stackra file contract:
 * Purpose: one page of answers to an EntityPicker's search: the records of the page and the cursor of the next one,
 *          which the picker hands back to `loadOptions` when the list is scrolled to its end.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0318 (wave 7 vocabulary, decision 2:
 *          pages are cursor pages).
 */
import type { EntityOption } from "#contracts/types/entity-option.type";

/** One page of the records that match a search. */
export interface EntityOptionPage {
  /** The records of this page, in the order to show them. */
  readonly items: readonly EntityOption[];
  /** The cursor of the next page; `null` or missing when this is the last one. */
  readonly nextCursor?: string | null | undefined;
}
