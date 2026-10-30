/**
 * Stackra file contract:
 * Purpose: `SortableListItem`, the least one row of a `SortableList` carries.
 * Boundary: types only; a caller's own row type extends it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory (2026-10-28) row 10.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One row of a sortable list. */
export interface SortableListItem extends CollectionItem {
  /** The text of the row; it is also its accessible name and what the move announcements say. */
  readonly label: string;
  /** A second, muted line under the label. */
  readonly description?: string | undefined;
  /** True to keep the row where it is: it cannot be picked up. */
  readonly isDisabled?: boolean | undefined;
}
