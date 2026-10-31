/**
 * Stackra file contract:
 * Purpose: `TamoCollectionToolsProps`, the props of the web `TamoCollectionTools` in `tamo-collection-tools.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataGridChanges } from "#contracts/types/data-grid-changes.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** Props of the web TamoCollectionTools. */
export interface TamoCollectionToolsProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine Tamo filters, sorts, summarises and fills. */
  readonly collection: CollectionController<TItem>;
  /** The records' name ("Orders"), for the popover's title. */
  readonly label: string;
  /** Writes Tamo's column fill once applied, by row id then column id; left out, "Fill a column" is not offered. */
  readonly onFill?: ((changes: DataGridChanges) => void | Promise<void>) | undefined;
  /** Writes one filled cell, as a DataTable's inline edit does; used when `onFill` is left out. */
  readonly onCellEdit?:
    | ((item: TItem, columnId: string, value: DataGridValue) => void | Promise<void>)
    | undefined;
}
