/**
 * Stackra file contract:
 * Purpose: the "matrix" demo of the native DataGrid: T-shirt stock by colour and size; each colour shows its total and
 *          the list ends with the grand total; a row's sheet edits its sizes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0317 amendment 2026-10-28.
 */
import type { DataGridColumn, DataGridRow } from "@stackra/ui/contracts";
import { DataGrid, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_GRID_DEMO_KEYS } from "#src/demos/free/data-grid/data-grid-demo-keys.constant";

/** The demo's keys. */
const K = DATA_GRID_DEMO_KEYS.demo_free.data_grid;

/** The sizes, as the label prints them. */
const SIZES = ["S", "M", "L", "XL"] as const;

/** A quantity matrix on a phone. */
export default function Matrix() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly DataGridColumn[] = [
    { id: "colour", label: t(K.colour) },
    ...SIZES.map((size) => ({ id: size, label: size })),
  ];
  const [rows, setRows] = useState<readonly DataGridRow[]>(() =>
    (["black", "white", "olive"] as const).map((colour, index) => ({
      id: colour,
      colour: t(K[colour]),
      S: 4 + index,
      M: 12 - index * 2,
      L: 9,
      XL: index,
    })),
  );
  return (
    <DataGrid
      label={t(K.matrix_label)}
      variant="matrix"
      columns={columns}
      rows={rows}
      onSave={(changes) =>
        setRows((current) => current.map((row) => ({ ...row, ...changes[row.id] })))
      }
    />
  );
}
