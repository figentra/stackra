/**
 * Stackra file contract:
 * Purpose: `CollectionSortEditorProps`, the props of the web `CollectionSortEditor`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props of the web CollectionSortEditor. */
export interface CollectionSortEditorProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose sort keys are edited. */
  readonly collection: CollectionController<TItem>;
  /** The records' name, for the list's accessible name. */
  readonly label: string;
}
