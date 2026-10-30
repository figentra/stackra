/**
 * Stackra file contract:
 * Purpose: `CollectionFilterEditorProps`, the props of the web `CollectionFilterEditor`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props of the web CollectionFilterEditor. */
export interface CollectionFilterEditorProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose rule tree is edited. */
  readonly collection: CollectionController<TItem>;
  /** The records' name, for the builder's accessible name. */
  readonly label: string;
}
