/**
 * Stackra file contract:
 * Purpose: `TocItem`: one row of a component page's table of contents: the anchor id, its text and its depth.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 10); showcase redesign spec section 4.
 */

/** One table-of-contents row. */
export interface TocItem {
  /** The element id the row links to (`api`, `example-variants`, `api-Button`). */
  readonly id: string;
  /** The row's text. */
  readonly label: string;
  /** 2 for a section, 3 for an example or an API part under it. */
  readonly level: 2 | 3;
}
