/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native DataTable: a pretend server of 12 orders that searches, sorts, pages, selects and acts.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import {
  Button,
  DataTable,
  SearchField,
  Text,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderActions } from "#src/demos/free/data-table/use-order-actions";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table;

/** How many rows a page holds. */
const PAGE_SIZE = 4;

/** The engine searches, sorts and pages the orders; a new search or sort goes back to the first page. */
export default function Live() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const { sortableColumns, renderCell } = useOrderTable();
  const { rowActions, bulkActions } = useOrderActions(setLast);
  const collection = useCollection({
    columns: sortableColumns,
    items: ORDERS,
    paging: "page",
    initialState: { pageSize: PAGE_SIZE },
  });

  return (
    <View className="gap-3">
      <DataTable
        scrollEnabled={false}
        label={t(K.live.label)}
        collection={collection}
        renderCell={renderCell}
        headingLevel={4}
        filterBar={
          <SearchField
            accessibilityLabel={t(K.live.search)}
            placeholder={t(K.live.search)}
            value={collection.state.search}
            onChange={collection.setSearch}
          />
        }
        rowActions={rowActions}
        selectionMode="multiple"
        bulkActions={bulkActions(() => collection.setSelection([]))}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.live.matching, { count: collection.totalCount })}
      </Text>
      <Text tone="muted">{last === null ? t(K.last_none) : t(K.last, { text: last })}</Text>
      <Button size="sm" variant="tertiary" onPress={collection.reset}>
        {t(K.live.reset)}
      </Button>
    </View>
  );
}
