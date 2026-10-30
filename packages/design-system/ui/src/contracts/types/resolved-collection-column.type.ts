/**
 * Stackra file contract:
 * Purpose: `ResolvedCollectionColumn`, a column with the user's state applied: its shown name, width, pin, wrap and visibility.
 * Boundary: types only; `useCollection` returns them in display order (pinned start, the rest, pinned end).
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";

/** A column as drawn. */
export interface ResolvedCollectionColumn extends CollectionColumn {
  /** The column's own `label`, before the user renamed it. */
  readonly defaultLabel: string;
  /** True when it is hidden. */
  readonly isHidden: boolean;
  /** True when it can be hidden (never the row header). */
  readonly canHide: boolean;
}
