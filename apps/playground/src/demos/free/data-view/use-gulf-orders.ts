/**
 * Stackra file contract:
 * Purpose: `useGulfOrders()`, the shared data of the collection demos: sixty orders of Saudi and Gulf businesses
 *          (customer, city, product, channel, status, quantity, total in riyals, date) in the active locale's words, the
 *          columns the engine takes for them, and the cell renderer that writes riyals, dates and status chips.
 * Boundary: demo data only; deterministic (no randomness), so screenshots and tests repeat. Every word comes from the
 *           `data_view` catalogue.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); Arabic voice guide (Qossai, 2026-10-28).
 */
import type { CollectionColumn, TableColumn } from "@stackra/ui/contracts";
import { Chip, MoneyValue, useCatalogueText } from "@stackra/ui/react";
import { createElement, useMemo, type ReactNode } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_VIEW_KEYS } from "#src/demos/free/data-view/data-view-keys.constant";
import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";

/** The words. */
const K = DATA_VIEW_KEYS.data_view;

/** The statuses, with the tone of their chip. */
const STATUSES = [
  ["paid", "success"],
  ["shipped", "accent"],
  ["pending", "warning"],
  ["refunded", "danger"],
] as const;

/** The channels. */
const CHANNELS = ["online", "branch", "whatsapp"] as const;

/** The demos' orders, columns and cells. */
export function useGulfOrders(count = 60) {
  const t = useCatalogueText(MESSAGES.en);
  const customers = Array.from({ length: 12 }, (_, index) =>
    t(K[`customer_${index}` as "customer_0"]),
  );
  const cities = Array.from({ length: 6 }, (_, index) => t(K[`city_${index}` as "city_0"]));
  const products = Array.from({ length: 8 }, (_, index) => t(K[`product_${index}` as "product_0"]));
  const statuses = STATUSES.map(([id, tone]) => ({ id, tone, label: t(K[`status_${id}`]) }));
  const channels = CHANNELS.map((id) => t(K[`channel_${id}`]));
  const key = customers.join("|");

  const orders = useMemo<readonly GulfOrder[]>(
    () =>
      Array.from({ length: count }, (_, index) => {
        const quantity = ((index * 7) % 12) + 1;
        const price = [85, 140, 320, 95, 260, 180, 450, 120][index % 8] ?? 100;
        return {
          id: `ord-${24_001 + index}`,
          order: `#${24_001 + index}`,
          customer: customers[(index * 5) % 12] ?? "",
          city: cities[(index + Math.floor(index / 4)) % 6] ?? "",
          product: products[(index * 3 + 1) % 8] ?? "",
          channel: channels[index % 3] ?? "",
          status: statuses[(index * 7) % 4]?.label ?? "",
          quantity,
          total: quantity * price,
          date: `2026-10-${String(28 - (index % 28)).padStart(2, "0")}`,
        };
      }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: the words change only with the locale (`key`)
    [count, key],
  );

  const columns: readonly CollectionColumn[] = [
    { id: "order", label: t(K.column_order), isRowHeader: true, isSortable: true, width: 112 },
    { id: "customer", label: t(K.column_customer), isSortable: true, width: 240 },
    {
      id: "city",
      label: t(K.column_city),
      isSortable: true,
      isGroupable: true,
      type: "choice",
      options: cities.map((city) => ({ id: city, label: city })),
      width: 140,
    },
    { id: "product", label: t(K.column_product), isSortable: true, isGroupable: true, width: 170 },
    {
      id: "channel",
      label: t(K.column_channel),
      isGroupable: true,
      type: "choice",
      options: channels.map((channel) => ({ id: channel, label: channel })),
      width: 160,
    },
    {
      id: "status",
      label: t(K.column_status),
      isSortable: true,
      isGroupable: true,
      type: "choice",
      options: statuses.map((status) => ({ id: status.label, label: status.label })),
      width: 150,
    },
    {
      id: "quantity",
      label: t(K.column_quantity),
      type: "number",
      isSortable: true,
      align: "end",
      width: 112,
    },
    {
      id: "total",
      label: t(K.column_total),
      type: "number",
      isSortable: true,
      align: "end",
      aggregate: "sum",
      width: 150,
    },
    { id: "date", label: t(K.column_date), isSortable: true, width: 150 },
  ];

  const renderCell = (item: GulfOrder, column: TableColumn): ReactNode => {
    switch (column.id) {
      case "total": {
        return createElement(MoneyValue, { amount: item.total, currency: "SAR" });
      }
      case "quantity": {
        return t(K.quantity, { count: item.quantity });
      }
      case "date": {
        return t(K.day, { date: new Date(`${item.date}T12:00:00Z`) });
      }
      case "status": {
        const tone = statuses.find((status) => status.label === item.status)?.tone ?? "default";
        return createElement(Chip, { size: "sm", variant: "soft", tone, children: item.status });
      }
      default: {
        return String((item as unknown as Record<string, unknown>)[column.id] ?? "");
      }
    }
  };

  return { orders, columns, renderCell, t, K };
}
