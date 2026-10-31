/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the native DataTable: selected rows bring up the bulk bar, which offers all matching.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { DataTable, Text, useCatalogueText, useCollection } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderActions } from "#src/demos/free/data-table/use-order-actions";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table;

/** Archive succeeds and clears the selection; Delete fails and leaves it. */
export default function Selection() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  // Server mode: three rows shown of every order that matches, so "select all" reaches past them.
  const collection = useCollection({
    columns,
    items: ORDERS.slice(0, 3),
    mode: "server",
    totalCount: ORDERS.length,
    initialState: { selection: ["ord-1001", "ord-1002"] },
  });
  const { selection: selected, isAllMatchingSelected: isAll } = collection.state;
  const { bulkActions } = useOrderActions(setLast);
  return (
    <View className="gap-3">
      <DataTable
        scrollEnabled={false}
        label={t(K.selection.label)}
        collection={collection}
        renderCell={renderCell}
        headingLevel={4}
        selectionMode="multiple"
        bulkActions={bulkActions(() => collection.setSelection([]))}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {selected.length === 0
          ? t(K.selection.none)
          : t(K.selection.selected, { keys: selected.join(", ") })}
      </Text>
      <Text tone="muted">{t(isAll ? K.selection.all_yes : K.selection.all_no)}</Text>
      <Text tone="muted">{last === null ? t(K.last_none) : t(K.last, { text: last })}</Text>
    </View>
  );
}
