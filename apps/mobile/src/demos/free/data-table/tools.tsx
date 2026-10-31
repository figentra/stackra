/**
 * Stackra file contract:
 * Purpose: the "tools" demo of the native DataTable: one engine's saved views drawn as tabs, chips and the menu that
 *          saves them, and the column editor that hides and moves columns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the engine filters the rows in client mode.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0505 (one SavedViews, one column editor).
 */
import {
  ColumnEditor,
  DataTable,
  SavedViews,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table;

/** One engine's saved views drawn three ways, and the column editor. */
export default function Tools() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  const collection = useCollection({
    columns,
    items: ORDERS,
    views: [
      {
        id: "all",
        label: t(K.tools.view_all),
        state: { filter: { match: "all", conditions: [] } },
      },
      {
        id: "unpaid",
        label: t(K.tools.view_unpaid),
        state: {
          filter: {
            match: "all",
            conditions: [{ id: "s", field: "status", operator: "in", value: ["pending"] }],
          },
        },
      },
    ],
  });
  return (
    <View className="gap-3">
      <SavedViews collection={collection} variant="tabs" label={t(K.tools.views_tabs)} />
      <SavedViews collection={collection} variant="chips" label={t(K.tools.views_chips)} />
      <View className="flex-row flex-wrap gap-2">
        <SavedViews collection={collection} label={t(K.tools.views)} />
        <ColumnEditor collection={collection} />
      </View>
      <DataTable
        scrollEnabled={false}
        label={t(K.tools.label)}
        collection={collection}
        renderCell={renderCell}
        headingLevel={4}
      />
    </View>
  );
}
