/**
 * Stackra file contract:
 * Purpose: the "tools" demo of the web DataTable: saved views and status facet chips above the table drive its query,
 *          "Save view" keeps the current query, and the column chooser hides columns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the rows are filtered here as a server would.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); product audit 2026-10-28 (saved
 *          views, facet chips, column chooser); ADR 0060 (light, dark, RTL).
 */
import type { ResourceQuery, SavedView, TableColumn } from "@stackra/ui/contracts";
import { ColumnChooser, DataTable, SavedViews, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_KEYS } from "#src/demos/free/data-table/data-table-keys.constant";

/** The demo's keys. */
const K = DATA_TABLE_KEYS.data_table;

/** The statuses, as ids and as the chips name them. */
const STATUSES = ["Paid", "Pending", "Refunded"] as const;

/** Twelve orders. */
const ORDERS = Array.from({ length: 12 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  customer: ["Ada Lovelace", "Grace Hopper", "Linus Torvalds"][index % 3] ?? "",
  status: STATUSES[index % 3] ?? "Paid",
  total: ((index * 37) % 90) + 10,
}));

/** The query with nothing set. */
const ALL: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** Data table: Views, facets and columns. */
export default function Tools() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState<ResourceQuery>(ALL);
  const [hidden, setHidden] = useState<readonly string[]>([]);
  const [views, setViews] = useState<readonly SavedView[]>(() => [
    { id: "all", label: t(K.view_all), query: ALL },
    {
      id: "unpaid",
      label: t(K.view_unpaid),
      query: { ...ALL, filterValues: { status: ["Pending"] } },
    },
  ]);
  const columns: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order) },
    { id: "customer", label: t(K.column_customer) },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), align: "end" },
  ];
  const picked = query.filterValues["status"];
  const statuses = Array.isArray(picked) ? (picked as readonly string[]) : [];
  const items = ORDERS.filter((order) => statuses.length === 0 || statuses.includes(order.status));
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SavedViews
          label={t(K.views_label)}
          views={views}
          query={query}
          onQueryChange={setQuery}
          facetFilterId="status"
          facetLabel={t(K.facet_label)}
          facets={STATUSES.map((status) => ({
            id: status,
            label: status,
            count: ORDERS.filter((order) => order.status === status).length,
          }))}
          onSaveView={() =>
            setViews([...views, { id: `view-${views.length}`, label: t(K.saved_view_name), query }])
          }
        />
        <ColumnChooser columns={columns} hiddenColumns={hidden} onHiddenColumnsChange={setHidden} />
      </div>
      <DataTable
        label={t(K.tools_label)}
        items={items}
        columns={columns}
        hiddenColumns={hidden}
        query={query}
        onQueryChange={setQuery}
        headingLevel={4}
      />
    </div>
  );
}
