/**
 * Stackra file contract:
 * Purpose: the "headless" demo of the collection engine: `useCollection` with no component of the family: the demo draws its own search, sort buttons, rows and pager from the engine's state and rows.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { Button, SearchField, Text, useCatalogueText, useCollection } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { COLLECTION_ENGINE_KEYS } from "#src/demos/free/collection-engine/collection-engine-keys.constant";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The words. */
const E = COLLECTION_ENGINE_KEYS.collection_engine;

/** Collection engine: Headless. */
export default function Headless() {
  const words = useCatalogueText(MESSAGES.en);
  const { orders, columns, t, K } = useGulfOrders(40);
  const collection = useCollection({ columns, items: orders, paging: "page", initialState: { pageSize: 5 } });
  const { state } = collection;
  return (
    <div className="grid w-full gap-3">
      <SearchField
        aria-label={words(E.search)}
        placeholder={words(E.search)}
        value={state.search}
        onChange={collection.setSearch}
        isFullWidth
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => collection.setSort([{ column: "total", direction: "descending" }])}>
          {words(E.sort_total)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => collection.setSort([{ column: "customer", direction: "ascending" }])}>
          {words(E.sort_customer)}
        </Button>
      </div>
      <ol aria-label={words(E.rows)} className="m-0 grid list-none gap-2 p-0">
        {collection.rows.map((order) => (
          <li
            key={order.id}
            className="flex items-center justify-between gap-3 border border-separator bg-surface px-4 py-3"
            style={{ borderRadius: "var(--radius-container)" }}
          >
            <span className="grid">
              <span className="font-medium">{order.customer}</span>
              <span className="text-sm text-muted">{`${order.order} · ${order.city}`}</span>
            </span>
            <span className="tabular-nums">{t(K.amount, { amount: order.total })}</span>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" isDisabled={state.page === 0} onPress={() => collection.setPage(state.page - 1)}>
          {words(E.previous)}
        </Button>
        <Text tone="muted">{words(E.page, { page: state.page + 1, count: collection.pageCount })}</Text>
        <Button size="sm" variant="ghost" isDisabled={!collection.hasMore} onPress={() => collection.setPage(state.page + 1)}>
          {words(E.next)}
        </Button>
      </div>
    </div>
  );
}
