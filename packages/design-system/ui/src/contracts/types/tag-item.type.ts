/**
 * Stackra file contract:
 * Purpose: one tag of a TagGroup: its key, its text and whether it can be used. The list of them is the `items` prop,
 *          so both runtimes draw the same tags from the same data.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary).
 */

/** One tag of a TagGroup. */
export interface TagItem {
  /** The key the group's value holds when the tag is selected; unique within the list. */
  readonly id: string;
  /** The text of the tag; it is the tag's accessible name. */
  readonly label: string;
  /** True to show the tag but refuse selecting or removing it. */
  readonly isDisabled?: boolean | undefined;
}
