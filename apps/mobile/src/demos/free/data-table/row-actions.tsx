/**
 * Stackra file contract:
 * Purpose: the "row-actions" demo of the native DataTable: a menu per row; slow, refused and failing actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceQuery } from "@stackra/ui/contracts";
import { DataTable, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderActions } from "#src/demos/free/data-table/use-order-actions";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table;

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** Archive takes a moment, Refund is refused for an unpaid order, Delete fails. */
export default function RowActions() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  const { rowActions } = useOrderActions(setLast);
  return (
    <View className="gap-3">
      <DataTable
        scrollEnabled={false}
        label={t(K.row_actions.label)}
        items={ORDERS.slice(0, 3)}
        columns={columns}
        renderCell={renderCell}
        query={NO_QUERY}
        onQueryChange={() => undefined}
        rowActions={rowActions}
        headingLevel={4}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {last === null ? t(K.last_none) : t(K.last, { text: last })}
      </Text>
    </View>
  );
}
