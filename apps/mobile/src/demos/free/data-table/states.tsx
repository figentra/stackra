/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native DataTable: empty, no results, first load, reload, and a failed load with a retry.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, DataTable, Text, useCatalogueText, useCollection } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table.states;

/** A search no order matches. */
const NO_MATCH = "zzz";

/** One table per state around the rows. */
export default function States() {
  const [retries, setRetries] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  // The engine searches the rows itself, so a search no row matches shows the "no results" state.
  const searched = useCollection({
    columns,
    items: ORDERS.slice(0, 3),
    initialState: { search: NO_MATCH },
  });
  return (
    <View className="gap-4">
      <DataTable
        scrollEnabled={false}
        label={t(K.empty_label)}
        items={[]}
        columns={columns}
        headingLevel={4}
      />
      <DataTable
        scrollEnabled={false}
        label={t(K.no_results_label)}
        collection={searched}
        headingLevel={4}
      />
      <Button size="sm" variant="tertiary" onPress={() => searched.setSearch(NO_MATCH)}>
        {t(K.search_again)}
      </Button>
      <DataTable
        scrollEnabled={false}
        label={t(K.first_load_label)}
        items={[]}
        columns={columns}
        isLoading
        loadingLabel={t(K.loading)}
      />
      <DataTable
        scrollEnabled={false}
        label={t(K.reload_label)}
        items={ORDERS.slice(0, 2)}
        columns={columns}
        renderCell={renderCell}
        isLoading
        loadingLabel={t(K.loading)}
      />
      <DataTable
        scrollEnabled={false}
        label={t(K.error_label)}
        items={[]}
        columns={columns}
        error={t(K.failure)}
        isMessageShown
        onRetry={() => setRetries((count) => count + 1)}
        headingLevel={4}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.retries, { count: retries })}
      </Text>
    </View>
  );
}
