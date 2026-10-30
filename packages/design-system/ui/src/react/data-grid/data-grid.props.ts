/**
 * Stackra file contract:
 * Purpose: `DataGridProps`, the props of the web `DataGrid` in `data-grid.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { DataGridContractProps } from "#contracts/types/data-grid-contract-props.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";

/** Props of the web DataGrid: the shared contract plus the attributes of its root `div`. */
export type DataGridProps<TRow extends DataGridRow = DataGridRow> = DataGridContractProps<TRow> &
  Omit<ComponentPropsWithoutRef<"div">, keyof DataGridContractProps | "children">;
