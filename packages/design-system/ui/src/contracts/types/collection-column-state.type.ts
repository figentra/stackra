/**
 * Stackra file contract:
 * Purpose: `CollectionColumnState`, what a user changed about one column: shown or hidden, its own name, width, pin and wrap.
 * Boundary: types only; the order of the states is the column order. A field left out falls back to the column's definition.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { ColumnPin } from "#contracts/enums/column-pin.enum";

/** One column as the user arranged it. */
export interface CollectionColumnState {
  /** The column's `id`. */
  readonly id: string;
  /** True when the user hid it. */
  readonly isHidden?: boolean | undefined;
  /** The name the user gave it, shown in place of the column's `label`. */
  readonly label?: string | undefined;
  /** The width the user set, in CSS pixels. */
  readonly width?: number | undefined;
  /** The edge the user pinned it to; `null` unpins a column pinned by its definition. */
  readonly pin?: ColumnPin | null | undefined;
  /** True to wrap, false to truncate. */
  readonly wrap?: boolean | undefined;
}
