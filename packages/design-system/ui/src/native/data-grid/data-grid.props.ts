/**
 * Stackra file contract:
 * Purpose: `DataGridProps`, the props of the native `DataGrid` in `data-grid.tsx`.
 * Boundary: types only; a column's `pin` freezes it and the engine's density sets the row height; `rowHeight`,
 *           `maxHeight` and `hasColumnTools` are web-only and ignored here (a native `ColumnEditor` on the same
 *           `collection` arranges the columns).
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0505.
 */
import type { ViewProps } from "react-native";

import type { DataGridContractProps } from "#contracts/types/data-grid-contract-props.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";

/** Props of the native DataGrid: the shared contract plus the props of its root `View`. */
export type DataGridProps<TRow extends DataGridRow = DataGridRow> = DataGridContractProps<TRow> &
  Omit<ViewProps, keyof DataGridContractProps | "children">;
