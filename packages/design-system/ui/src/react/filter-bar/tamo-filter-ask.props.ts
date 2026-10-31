/**
 * Stackra file contract:
 * Purpose: `TamoFilterAskProps`, the props of the internal `TamoFilterAsk` in `tamo-filter-ask.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TamoSlot } from "#contracts/types/tamo-slot.type";

/** Props of the ask-to-filter box of a collection. */
export interface TamoFilterAskProps<TItem extends CollectionItem = CollectionItem> {
  readonly slot: TamoSlot;
  readonly collection: CollectionController<TItem>;
  /** Called once the proposal is applied or discarded (a popover closes). */
  readonly onDone?: (() => void) | undefined;
}
