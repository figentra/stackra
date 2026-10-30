/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native DataTable: a pretend server of 12 orders that searches, sorts, pages, selects and acts.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceQuery } from "@stackra/ui/contracts";
import { Button, DataTable, SearchField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import type { Order } from "#src/demos/free/data-table/order.type";
import { useOrderActions } from "#src/demos/free/data-table/use-order-actions";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table;

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** How many rows a page holds. */
const PAGE_SIZE = 4;

/**
 * The server: the orders that match the search, sorted as asked. The table is handed the result and never filters or
 * sorts, so this is the page's job. Ties keep the list's own order, which is stable.
 */
function ordersFor(query: ResourceQuery): readonly Order[] {
  const needle = query.search.trim().toLowerCase();
  const found = ORDERS.filter(
    (order) =>
      needle === "" ||
      order.order.toLowerCase().includes(needle) ||
      order.customer.toLowerCase().includes(needle),
  );
  if (!query.sort) return found;
  const key = query.sort.column as "order" | "customer" | "total";
  const factor = query.sort.direction === "ascending" ? 1 : -1;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; main keeps sort here too, as Hermes support for toSorted is not assumed
  return [...found].sort((first, second) => {
    const a = first[key];
    const b = second[key];
    const order =
      typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
    return order * factor;
  });
}

/** Every change of the query goes back to the first page and clears the selection. */
export default function Live() {
  const [query, setQuery] = useState<ResourceQuery>(NO_QUERY);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isAll, setIsAll] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const { sortableColumns, renderCell } = useOrderTable();
  const { rowActions, bulkActions } = useOrderActions(setLast);
  const matches = ordersFor(query);
  const next = cursor + PAGE_SIZE;

  const change = (nextQuery: ResourceQuery) => {
    setQuery(nextQuery);
    setCursor(0);
    setHistory([]);
    setSelected([]);
    setIsAll(false);
  };

  return (
    <View className="gap-3">
      <DataTable
        scrollEnabled={false}
        label={t(K.live.label)}
        items={matches.slice(cursor, next)}
        columns={sortableColumns}
        renderCell={renderCell}
        query={query}
        onQueryChange={change}
        headingLevel={4}
        filterBar={
          <SearchField
            accessibilityLabel={t(K.live.search)}
            placeholder={t(K.live.search)}
            value={query.search}
            onChange={(search) => change({ ...query, search })}
          />
        }
        rowActions={rowActions}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActions(() => {
          setSelected([]);
          setIsAll(false);
        })}
        totalCount={matches.length}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
        hasMore={next < matches.length}
        hasPrevious={history.length > 0}
        onNext={() => {
          setHistory((past) => [...past, cursor]);
          setCursor(next);
          setSelected([]);
        }}
        onPrevious={() => {
          setCursor(history.at(-1) ?? 0);
          setHistory((past) => past.slice(0, -1));
          setSelected([]);
        }}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.live.matching, { count: matches.length })}
      </Text>
      <Text tone="muted">{last === null ? t(K.last_none) : t(K.last, { text: last })}</Text>
      <Button size="sm" variant="tertiary" onPress={() => change(NO_QUERY)}>
        {t(K.live.reset)}
      </Button>
    </View>
  );
}
