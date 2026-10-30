/**
 * Stackra file contract:
 * Purpose: the "sheet" demo of the web DataGrid: a menu price list with text, number, select, boolean and date
 *          columns; select a range, copy it into a spreadsheet or paste a block back, drag the fill handle, undo, and
 *          save the pending changes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0317 amendment 2026-10-28
 *          (wave 3d, DataGrid); ADR 0060 (light, dark, RTL).
 */
import type { DataGridChanges, DataGridColumn, DataGridRow } from "@stackra/ui/contracts";
import { DataGrid, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_GRID_KEYS } from "#src/demos/free/data-grid/data-grid-keys.constant";

/** The demo's keys. */
const K = DATA_GRID_KEYS.data_grid;

/** How long the fake save takes, so the busy state can be seen. */
const DELAY = 600;

/** The saved rows with the changes applied. */
function applied(rows: readonly DataGridRow[], changes: DataGridChanges): DataGridRow[] {
  return rows.map((row) => ({ ...row, ...changes[row.id] }));
}

/** DataGrid: A price list sheet. */
export default function Sheet() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly DataGridColumn[] = [
    { id: "item", label: t(K.item), isRequired: true },
    {
      id: "price",
      label: t(K.price),
      type: "number",
      min: 0,
      max: 50,
      validate: (value) =>
        typeof value === "number" && (value * 10) % 5 !== 0 ? t(K.price_rule) : undefined,
    },
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
    { id: "from", label: t(K.from), type: "date", width: 180 },
  ];
  const [rows, setRows] = useState<readonly DataGridRow[]>(() =>
    (["latte", "mocha", "flat_white", "espresso", "cortado"] as const).map((key, index) => ({
      id: key,
      item: t(K[key]),
      price: 3 + index * 0.5,
      size: index % 2 === 0 ? "small" : "large",
      in_stock: index !== 3,
      from: `2026-11-0${index + 1}`,
    })),
  );
  return (
    <div className="grid gap-3">
      <Text type="small">{t(K.hint)}</Text>
      <DataGrid
        label={t(K.sheet_label)}
        columns={columns}
        rows={rows}
        onSave={(changes) =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              setRows((current) => applied(current, changes));
              resolve();
            }, DELAY);
          })
        }
      />
    </div>
  );
}
