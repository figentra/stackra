/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Table: `emptyState` with no rows, and busy while `isLoading`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { EmptyState, Table, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABLE_DEMO_KEYS } from "#src/demos/free/table/table-demo-keys.constant";

import { TABLE_ORDERS } from "#src/demos/free/table/table-orders.constant";
import { useTableColumns } from "#src/demos/free/table/use-table-columns";

/** The demo's keys. */
const K = TABLE_DEMO_KEYS.demo_free.table.states;

/** Empty, first load, and a reload that keeps the rows. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useTableColumns();
  return (
    <View className="gap-4">
      <Table
        label={t(K.empty_label)}
        items={[]}
        columns={columns}
        scrollEnabled={false}
        emptyState={
          <EmptyState headingLevel={3} title={t(K.empty_title)} description={t(K.empty_body)} />
        }
      />
      <Table
        label={t(K.loading_label)}
        items={[]}
        columns={columns}
        isLoading
        loadingLabel={t(K.loading)}
        scrollEnabled={false}
      />
      <Table
        label={t(K.reload_label)}
        items={TABLE_ORDERS.slice(0, 2)}
        columns={columns}
        renderCell={renderCell}
        isLoading
        loadingLabel={t(K.loading)}
        scrollEnabled={false}
      />
    </View>
  );
}
