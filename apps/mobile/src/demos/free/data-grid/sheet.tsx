/**
 * Stackra file contract:
 * Purpose: the "sheet" demo of the native DataGrid: a menu price list; press a row to quick-edit it in a sheet, or
 *          Select several rows and set one field on all of them; Save applies the pending changes.
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

/** A price list on a phone. */
export default function Sheet() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly DataGridColumn[] = [
    { id: "item", label: t(K.item), isRequired: true },
    { id: "price", label: t(K.price), type: "number", min: 0, max: 50 },
    {
      id: "size",
      label: t(K.size),
      type: "select",
      options: [
        { id: "small", label: t(K.small) },
        { id: "large", label: t(K.large) },
      ],
    },
    { id: "in_stock", label: t(K.in_stock), type: "boolean" },
  ];
  const [rows, setRows] = useState<readonly DataGridRow[]>(() =>
    (["latte", "mocha", "flat_white", "espresso"] as const).map((key, index) => ({
      id: key,
      item: t(K[key]),
      price: 3 + index * 0.5,
      size: index % 2 === 0 ? "small" : "large",
      in_stock: index !== 3,
    })),
  );
  return (
    <DataGrid
      label={t(K.sheet_label)}
      columns={columns}
      rows={rows}
      onSave={(changes) =>
        setRows((current) => current.map((row) => ({ ...row, ...changes[row.id] })))
      }
    />
  );
}
