/**
 * Stackra file contract:
 * Purpose: `DataViewProps`, the props of the native `DataView` in `data-view.tsx`: the shared contract plus the props
 *          of its root `View`.
 * Boundary: types only. The native DataView offers the list and cards views; the web-only props (grid, export, import,
 *           full screen) are read as nothing.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { View } from "react-native";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewContractProps } from "#contracts/types/data-view-contract-props.type";

/** Props of the native DataView. */
export type DataViewProps<TItem extends CollectionItem = CollectionItem> =
  DataViewContractProps<TItem> &
    Omit<ComponentPropsWithoutRef<typeof View>, keyof DataViewContractProps | "children">;
