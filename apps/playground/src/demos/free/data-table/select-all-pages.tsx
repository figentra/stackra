/**
 * Stackra file contract:
 * Purpose: the "select-all-pages" demo of the web DataTable: sixty orders paged by five, twice. Ticking a page offers
 *          "Select all 60" in the bulk bar; every page then shows ticked. On this device the bulk action gets every
 *          matching id; on the server it gets a descriptor of the search and filter, never ids it does not hold.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only; the "server" is the same
 *           rows sliced by page, as a fetch would answer.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (select all across pages); ADR 0060 (light, dark, RTL).
 */
import type {
  CollectionController,
  CollectionQuery,
  CollectionSelection,
} from "@stackra/ui/contracts";
import { DataTable, Text, useCollection } from "@stackra/ui/react";
import { useCallback } from "react";

import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns this demo hides, so both tables fit. */
const HIDDEN = new Set(["city", "product", "channel", "status", "quantity", "date"]);

/** Rows per page. */
const PAGE_SIZE = 5;

/** A selection as a short line: how many ids, or the descriptor as JSON. */
const describe = (selected: CollectionSelection) =>
  selected.kind === "ids"
    ? `ids × ${selected.ids.length}`
    : JSON.stringify({
        kind: selected.kind,
        search: selected.search,
        totalCount: selected.totalCount,
      });

/** One paged table with the bulk bar and what its bulk action would get. */
function Paged({
  label,
  collection,
}: {
  readonly label: string;
  readonly collection: CollectionController<GulfOrder>;
}) {
  const { renderCell, t, K } = useGulfOrders(0);
  return (
    <div className="grid gap-2">
      <DataTable
        label={label}
        items={collection.rows}
        columns={collection.columns}
        collection={collection}
        renderCell={renderCell}
        query={{ search: "", filterValues: {}, sort: null }}
        onQueryChange={() => {}}
        selectionMode="multiple"
        bulkActions={[{ id: "tag", label: t(K.tag) }]}
      />
      <Text role="status" tone="muted">
        <bdi>{t(K.acts_on, { text: describe(collection.selected) })}</bdi>
      </Text>
    </div>
  );
}

/** Data table: Select all across pages. */
export default function SelectAllPages() {
  const { orders, columns, t, K } = useGulfOrders(60);
  const start = {
    pageSize: PAGE_SIZE,
    columns: columns.map((column) => ({
      id: column.id,
      isHidden: HIDDEN.has(column.id),
      ...(column.id === "customer" ? { width: 200 } : {}),
    })),
  };
  // Stable, so the engine fetches once per query.
  const fetchPage = useCallback(
    async (query: CollectionQuery) => ({
      items: orders.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize),
      totalCount: orders.length,
    }),
    [orders],
  );
  const client = useCollection({ columns, items: orders, paging: "page", initialState: start });
  const server = useCollection({
    columns,
    // What a server would answer for the page asked for.
    items: orders.slice(0, PAGE_SIZE),
    mode: "server",
    paging: "page",
    totalCount: orders.length,
    initialState: start,
    fetch: fetchPage,
  });
  return (
    <div className="grid gap-6">
      <Text tone="muted">{t(K.select_hint)}</Text>
      <Paged label={t(K.select_client_label)} collection={client} />
      <Paged label={t(K.select_server_label)} collection={server} />
    </div>
  );
}
