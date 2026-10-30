/**
 * Stackra file contract:
 * Purpose: the "collection" demo of the web List: a List of customers driven by the collection engine: a search field and a sort by name narrow and order the rows, and the list fills its container's width.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { List, SearchField, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** List: On the collection engine. */
export default function Collection() {
  const { t, K } = useGulfOrders(0);
  const customers = Array.from({ length: 12 }, (_, index) => ({
    id: `c${index}`,
    name: t(K[`customer_${index}` as "customer_0"]),
    city: t(K[`city_${index % 6}` as "city_0"]),
  }));
  const collection = useCollection({
    columns: [
      { id: "name", label: t(K.column_customer), isSortable: true },
      { id: "city", label: t(K.column_city) },
    ],
    items: customers,
    initialState: { sort: [{ column: "name", direction: "ascending" }] },
  });
  return (
    <div className="grid gap-3">
      <SearchField
        aria-label={t(K.list_label)}
        placeholder={t(K.list_label)}
        value={collection.state.search}
        onChange={collection.setSearch}
        isFullWidth
      />
      <List
        label={t(K.list_label)}
        items={collection.rows.map((customer) => ({
          id: customer.id,
          title: customer.name,
          description: customer.city,
        }))}
      />
    </div>
  );
}
