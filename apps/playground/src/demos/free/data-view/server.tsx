/**
 * Stackra file contract:
 * Purpose: the "server" demo of DataView: server mode. The engine hands a fetcher the query object (search, rule tree, sort keys, page); a simulated server answers after about 600 ms with the page and the total, and the last query is shown as JSON.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import type { CollectionQuery } from "@stackra/ui/contracts";
import { applyCollection, defaultCollectionStateOf, resolveCollectionColumns } from "@stackra/ui";
import { CodeBlock, DataView, Text, useCollection } from "@stackra/ui/react";
import { useCallback, useState } from "react";

import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Server mode. */
export default function Server() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(240);
  const [last, setLast] = useState<CollectionQuery | null>(null);
  // The "server": it applies the query to its rows, as a database would, and answers late.
  const fetchPage = useCallback(
    (query: CollectionQuery, signal: AbortSignal) =>
      new Promise<{ items: readonly GulfOrder[]; totalCount: number }>((resolve, reject) => {
        setLast(query);
        const timer = setTimeout(() => {
          const state = {
            ...defaultCollectionStateOf(columns),
            search: query.search,
            filter: query.filter,
            sort: query.sort,
            page: query.page,
            pageSize: query.pageSize,
          };
          const page = applyCollection(
            orders,
            state,
            resolveCollectionColumns(columns, []),
            "page",
            "en",
          );
          resolve({ items: page.rows, totalCount: page.matched.length });
        }, 600);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(signal.reason);
        });
      }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: the rows change only with the locale
    [orders],
  );
  const collection = useCollection({
    columns,
    mode: "server",
    paging: "page",
    initialState: { pageSize: 10 },
    fetch: fetchPage,
  });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.server_latency)}</Text>
      <DataView
        label={t(K.server_label)}
        collection={collection}
        renderCell={renderCell}
        cards={{ title: "customer", subtitle: "order", meta: "total" }}
      />
      <CodeBlock title={t(K.server_query)} language="json" code={JSON.stringify(last, null, 2)} />
    </div>
  );
}
