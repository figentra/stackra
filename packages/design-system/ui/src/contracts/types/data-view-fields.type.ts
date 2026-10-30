/**
 * Stackra file contract:
 * Purpose: `DataViewFields`, what the list and cards views of a DataView show of a row: the title, subtitle and meta columns, the media and the fields.
 * Boundary: types only; a column is named by its id, and left out the view picks from the visible columns.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";

/** What a list row or a card shows of a row. */
export interface DataViewFields<TItem extends CollectionItem = CollectionItem> {
  /** The column whose text is the title. Defaults to the row header. */
  readonly title?: string | undefined;
  /** The column whose text is the muted line under the title. Defaults to the next visible column. */
  readonly subtitle?: string | undefined;
  /** The column shown at the trailing end (a list) or the top end (a card), such as a status or an amount. */
  readonly meta?: string | undefined;
  /** The leading media of a list row or the top of a card: an avatar, a thumbnail or an icon. */
  readonly media?: ((item: TItem) => ReactNode) | undefined;
  /** The columns listed as label and value on a card. Defaults to the other visible columns. */
  readonly fields?: readonly string[] | undefined;
}
