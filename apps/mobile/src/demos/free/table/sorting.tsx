/**
 * Stackra file contract:
 * Purpose: the "sorting" demo of the native Table: a sortable header asks through `onSortChange`; the page sorts.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SortDescriptor } from "@stackra/ui/contracts";
import { Table, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABLE_DEMO_KEYS } from "#src/demos/free/table/table-demo-keys.constant";

import type { TableOrder } from "#src/demos/free/table/table-order.type";
import { TABLE_ORDERS } from "#src/demos/free/table/table-orders.constant";
import { useTableColumns } from "#src/demos/free/table/use-table-columns";

/** The demo's keys. */
const K = TABLE_DEMO_KEYS.demo_free.table.sorting;

/** The orders sorted as asked; ties keep the list's own order, which is stable. */
function sortedOrders(
  orders: readonly TableOrder[],
  sort: SortDescriptor | undefined,
): readonly TableOrder[] {
  if (!sort) return orders;
  const key = sort.column as "order" | "customer" | "total";
  const factor = sort.direction === "ascending" ? 1 : -1;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; main keeps sort here too, as Hermes support for toSorted is not assumed
  return [...orders].sort((first, second) => {
    const a = first[key];
    const b = second[key];
    return (
      (typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b))) * factor
    );
  });
}

/** The page hands the sorted rows back. */
export default function Sorting() {
  const [sort, setSort] = useState<SortDescriptor | undefined>({
    column: "total",
    direction: "descending",
  });
  const t = useCatalogueText(MESSAGES.en);
  const { sortableColumns, renderCell } = useTableColumns();
  return (
    <View className="gap-3">
      <Table
        label={t(K.label)}
        items={sortedOrders(TABLE_ORDERS, sort)}
        columns={sortableColumns}
        renderCell={renderCell}
        sortDescriptor={sort}
        onSortChange={setSort}
        scrollEnabled={false}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {sort ? t(K.sorted, { column: sort.column, direction: sort.direction }) : t(K.none)}
      </Text>
    </View>
  );
}
