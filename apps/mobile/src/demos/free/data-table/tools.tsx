/**
 * Stackra file contract:
 * Purpose: the "tools" demo of the native DataTable: saved views and status chips drive the query and the column
 *          chooser hides columns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the rows are filtered here as a server would.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); product audit 2026-10-28.
 */
import type { ResourceQuery, SavedView } from "@stackra/ui/contracts";
import { ColumnChooser, DataTable, SavedViews, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table;

/** The query with nothing set. */
const ALL: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** The statuses the chips offer. */
const STATUSES = ["paid", "pending", "refunded"] as const;

/** Views, facet chips and a column chooser. */
export default function Tools() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  const [query, setQuery] = useState<ResourceQuery>(ALL);
  const [hidden, setHidden] = useState<readonly string[]>([]);
  const views: readonly SavedView[] = [
    { id: "all", label: t(K.tools.view_all), query: ALL },
    {
      id: "unpaid",
      label: t(K.tools.view_unpaid),
      query: { ...ALL, filterValues: { status: ["pending"] } },
    },
  ];
  const picked = query.filterValues["status"];
  const statuses = Array.isArray(picked) ? (picked as readonly string[]) : [];
  const items = ORDERS.filter((order) => statuses.length === 0 || statuses.includes(order.status));
  return (
    <View className="gap-3">
      <SavedViews
        label={t(K.tools.views)}
        views={views}
        query={query}
        onQueryChange={setQuery}
        facetFilterId="status"
        facetLabel={t(K.columns.status)}
        facets={STATUSES.map((status) => ({
          id: status,
          label: t(K.status[status]),
          count: ORDERS.filter((order) => order.status === status).length,
        }))}
      />
      <ColumnChooser columns={columns} hiddenColumns={hidden} onHiddenColumnsChange={setHidden} />
      <DataTable
        scrollEnabled={false}
        label={t(K.tools.label)}
        items={items}
        columns={columns}
        renderCell={renderCell}
        hiddenColumns={hidden}
        query={query}
        onQueryChange={setQuery}
        headingLevel={4}
      />
    </View>
  );
}
