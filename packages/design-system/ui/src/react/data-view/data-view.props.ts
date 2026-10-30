/**
 * Stackra file contract:
 * Purpose: `DataViewProps`, the props of the web `DataView` in `data-view.tsx`: the shared contract plus the attributes
 *          of its root `div`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewContractProps } from "#contracts/types/data-view-contract-props.type";
import type { ImportDialogProps } from "#react/import-dialog/import-dialog.props";

/** Props of the web DataView: the import options are the web dialog's, which also reads the file (`onRead`). */
export type DataViewProps<TItem extends CollectionItem = CollectionItem> = Omit<
  DataViewContractProps<TItem>,
  "importOptions"
> & {
  readonly importOptions?: Omit<ImportDialogProps, "trigger"> | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, keyof DataViewContractProps | "children">;
