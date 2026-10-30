/**
 * Stackra file contract:
 * Purpose: the "server-scale" demo of DataView: server mode end to end. A mock server (`createMemoryCollectionSource`
 *          over ten thousand orders, about 300 ms a query) answers the engine's queries: the search, the and/or filter,
 *          the sort keys, the group and the next page, appended as the end of the virtualised rows scrolls into view
 *          (`infinite` paging). The bulk action sends the selection descriptor (ids, or every match but the unticked
 *          ones) to the server, which resolves it; the last query, the request count and the answer are shown.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only; no network.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (server mode, infinite scroll); ADR 0060 (light, dark, RTL).
 */
import { createMemoryCollectionSource } from "@stackra/ui";
import type { CollectionQuery, CollectionSource } from "@stackra/ui/contracts";
import { CodeBlock, DataView, Text, useCollection } from "@stackra/ui/react";
import { useMemo, useState } from "react";

import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Server mode with infinite scroll. */
export default function ServerScale() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(10_000);
  const [last, setLast] = useState<CollectionQuery | null>(null);
  const [requests, setRequests] = useState(0);
  const [tagged, setTagged] = useState<number | null>(null);
  // The mock server, counting and showing each query it is asked.
  const server = useMemo(
    () => createMemoryCollectionSource(orders, columns, { latency: 300 }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps, react/memo-dependencies -- reason: the columns are rebuilt each render; they change only with the rows' locale
    [orders],
  );
  const source = useMemo<CollectionSource<GulfOrder>>(
    () => ({
      ...server,
      fetch: (query, signal) => {
        setLast(query);
        setRequests((count) => count + 1);
        return server.fetch(query, signal);
      },
    }),
    [server],
  );
  const collection = useCollection({
    columns,
    mode: "server",
    paging: "infinite",
    initialState: { pageSize: 100 },
    source,
  });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.server_scale_hint)}</Text>
      <Text role="status" tone="muted">
        {`${t(K.loaded, { loaded: collection.rows.length, total: collection.totalCount })} · ${t(K.server_requests, { count: requests })}`}
      </Text>
      <DataView
        label={t(K.server_scale_label)}
        collection={collection}
        renderCell={renderCell}
        isVirtualized
        cards={{ title: "customer", subtitle: "order", meta: "total", fields: ["city", "status"] }}
        bulkActions={[
          {
            id: "tag",
            label: t(K.tag_on_server),
            onPress: async () => {
              const ids = (await server.resolve?.(collection.selected)) ?? [];
              setTagged(ids.length);
            },
          },
        ]}
      />
      {tagged === null ? null : (
        <Text role="status" tone="muted">
          {t(K.tagged, { count: tagged })}
        </Text>
      )}
      <CodeBlock title={t(K.server_query)} language="json" code={JSON.stringify(last, null, 2)} />
    </div>
  );
}
