/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native DataTable: empty, no results, first load, reload, and a failed load with a retry.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceQuery } from "@stackra/ui/contracts";
import { Button, DataTable, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table.states;

/** The query with nothing set, and a search no order matches. */
const NO_QUERY: ResourceQuery = { search: "", filterValues: {}, sort: null };
const NO_RESULTS_QUERY: ResourceQuery = { search: "zzz", filterValues: {}, sort: null };

/** Does nothing: a table whose query never changes. */
const ignore = () => undefined;

/** One table per state around the rows. */
export default function States() {
  const [query, setQuery] = useState<ResourceQuery>(NO_RESULTS_QUERY);
  const [retries, setRetries] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  return (
    <View className="gap-4">
      <DataTable
        scrollEnabled={false}
        label={t(K.empty_label)}
        items={[]}
        columns={columns}
        query={NO_QUERY}
        onQueryChange={ignore}
        headingLevel={4}
      />
      <DataTable
        scrollEnabled={false}
        label={t(K.no_results_label)}
        items={[]}
        columns={columns}
        query={query}
        onQueryChange={setQuery}
        headingLevel={4}
      />
      <Button size="sm" variant="tertiary" onPress={() => setQuery(NO_RESULTS_QUERY)}>
        {t(K.search_again)}
      </Button>
      <DataTable
        scrollEnabled={false}
        label={t(K.first_load_label)}
        items={[]}
        columns={columns}
        query={NO_QUERY}
        onQueryChange={ignore}
        isLoading
        loadingLabel={t(K.loading)}
      />
      <DataTable
        scrollEnabled={false}
        label={t(K.reload_label)}
        items={ORDERS.slice(0, 2)}
        columns={columns}
        renderCell={renderCell}
        query={NO_QUERY}
        onQueryChange={ignore}
        isLoading
        loadingLabel={t(K.loading)}
      />
      <DataTable
        scrollEnabled={false}
        label={t(K.error_label)}
        items={[]}
        columns={columns}
        query={NO_QUERY}
        onQueryChange={ignore}
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
