/**
 * Stackra file contract:
 * Purpose: the "column-editor" demo of the native DataGrid: a menu price list and a ColumnEditor on one collection
 *          engine; hide, reorder, rename or pin a column, or change the density, in the sheet and the grid follows.
 *          Press a header to sort; the item column stays in view while the others scroll sideways.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); STA-1371.
 */
import type { CollectionColumn, DataGridRow } from "@stackra/ui/contracts";
import { ColumnEditor, DataGrid, useCatalogueText, useCollection } from "@stackra/ui/native";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_GRID_DEMO_KEYS } from "#src/demos/free/data-grid/data-grid-demo-keys.constant";

/** The demo's keys. */
const K = DATA_GRID_DEMO_KEYS.demo_free.data_grid;

/** A price list whose columns the user arranges. */
export default function ColumnEditorDemo() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly CollectionColumn[] = useMemo(
    () => [
      { id: "item", label: t(K.item), isRequired: true },
      { id: "price", label: t(K.price), type: "number", min: 0, max: 50 },
      {
        id: "size",
        label: t(K.size),
        type: "choice",
        options: [
          { id: "small", label: t(K.small) },
          { id: "large", label: t(K.large) },
        ],
      },
      { id: "in_stock", label: t(K.in_stock), type: "boolean" },
    ],
    [t],
  );
  const [rows, setRows] = useState<readonly DataGridRow[]>(() =>
    (["latte", "mocha", "flat_white", "espresso"] as const).map((key, index) => ({
      id: key,
      item: t(K[key]),
      price: 3 + index * 0.5,
      size: index % 2 === 0 ? "small" : "large",
      in_stock: index !== 3,
    })),
  );
  // The grid's columns are the engine's: one column type for both.
  const collection = useCollection({
    columns,
    items: rows,
    initialState: { columns: [{ id: "item", pin: "start" }] },
  });
  return (
    <View className="gap-3">
      <View className="items-end">
        <ColumnEditor collection={collection} />
      </View>
      <DataGrid
        label={t(K.sheet_label)}
        collection={collection}
        onSave={(changes) =>
          setRows((current) => current.map((row) => ({ ...row, ...changes[row.id] })))
        }
      />
    </View>
  );
}
