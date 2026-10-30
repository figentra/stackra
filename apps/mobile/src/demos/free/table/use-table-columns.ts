/**
 * Stackra file contract:
 * Purpose: `useTableColumns`, the translated columns and the drawn cell the native Table demos share.
 * Boundary: a hook over the active catalogue, in a `.ts` file (no JSX) so the demo tooling never takes it for a demo.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { Tone } from "@stackra/contracts";
import type { TableColumn } from "@stackra/ui/contracts";
import { Chip, useCatalogueText } from "@stackra/ui/native";
import { createElement, type ReactNode } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABLE_DEMO_KEYS } from "#src/demos/free/table/table-demo-keys.constant";
import type { TableOrder } from "#src/demos/free/table/table-order.type";

/** The keys of the columns and statuses. */
const K = TABLE_DEMO_KEYS.demo_free.table;

/** The tone of each status chip. */
const STATUS_TONE: Readonly<Record<TableOrder["status"], Tone>> = Object.freeze({
  paid: "success",
  pending: "warning",
  refunded: "default",
});

/** Fixed to US dollars in English, so a total reads the same in both reading directions. */
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The columns (plain and sortable: every one but the status) and the drawn cell. */
export function useTableColumns(): {
  readonly columns: readonly TableColumn[];
  readonly sortableColumns: readonly TableColumn[];
  readonly renderCell: (order: TableOrder, column: TableColumn) => ReactNode;
} {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly TableColumn[] = [
    { id: "order", label: t(K.columns.order) },
    { id: "customer", label: t(K.columns.customer) },
    { id: "status", label: t(K.columns.status) },
    { id: "total", label: t(K.columns.total) },
  ];
  return {
    columns,
    sortableColumns: columns.map((column) => ({ ...column, isSortable: column.id !== "status" })),
    renderCell: (order, column) => {
      if (column.id === "status")
        return createElement(Chip, {
          size: "sm",
          tone: STATUS_TONE[order.status],
          children: t(K.status[order.status]),
        });
      if (column.id === "total") return MONEY.format(order.total);
      return order[column.id as "order" | "customer"];
    },
  };
}
