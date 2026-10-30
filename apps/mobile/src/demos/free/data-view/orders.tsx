/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the native DataView: twenty Gulf orders as a list (customer, order, total) or cards,
 *          with the search field and the search, filter and sort sheet, grouped by city on demand.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn } from "@stackra/ui/contracts";
import { DataView, useCatalogueText, useCollection } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_VIEW_DEMO_KEYS } from "#src/demos/free/data-view/data-view-demo-keys.constant";

/** The demo's keys. */
const K = DATA_VIEW_DEMO_KEYS.demo_free.data_view.orders;

/** Orders on a phone. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  const customers = [
    K.customer_0,
    K.customer_1,
    K.customer_2,
    K.customer_3,
    K.customer_4,
    K.customer_5,
  ].map((key) => t(key));
  const cities = [K.city_0, K.city_1, K.city_2].map((key) => t(key));
  const statuses = [K.status_paid, K.status_pending, K.status_shipped].map((key) => t(key));
  const orders = Array.from({ length: 20 }, (_, index) => ({
    id: `ord-${24_001 + index}`,
    order: `#${24_001 + index}`,
    customer: customers[(index * 5) % 6] ?? "",
    city: cities[index % 3] ?? "",
    status: statuses[(index * 7) % 3] ?? "",
    total: (((index * 7) % 12) + 1) * 85,
  }));
  const columns: readonly CollectionColumn[] = [
    { id: "customer", label: t(K.column_customer), isSortable: true, isRowHeader: true },
    { id: "order", label: t(K.column_order), isSortable: true },
    {
      id: "city",
      label: t(K.column_city),
      isGroupable: true,
      type: "choice",
      options: cities.map((city) => ({ id: city, label: city })),
    },
    {
      id: "status",
      label: t(K.column_status),
      isGroupable: true,
      type: "choice",
      options: statuses.map((status) => ({ id: status, label: status })),
    },
    { id: "total", label: t(K.column_total), type: "number", isSortable: true },
  ];
  const collection = useCollection({ columns, items: orders, initialState: { layout: "list" } });
  return (
    <DataView
      label={t(K.label)}
      collection={collection}
      list={{ subtitle: "order", meta: "total" }}
      cards={{ subtitle: "city", meta: "status", fields: ["order", "total"] }}
      renderCell={(item, column) =>
        column.id === "total"
          ? t(K.amount, { amount: item.total })
          : String(item[column.id as keyof typeof item])
      }
    />
  );
}
