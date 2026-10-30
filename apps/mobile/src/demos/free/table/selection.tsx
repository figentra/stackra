/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the native Table: `selectionMode` single or multiple; a selected row is tinted.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Table, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABLE_DEMO_KEYS } from "#src/demos/free/table/table-demo-keys.constant";

import { TABLE_ORDERS } from "#src/demos/free/table/table-orders.constant";
import { useTableColumns } from "#src/demos/free/table/use-table-columns";

/** The demo's keys. */
const K = TABLE_DEMO_KEYS.demo_free.table.selection;

/** One row, then several. */
export default function Selection() {
  const [one, setOne] = useState<readonly string[]>(["ord-1002"]);
  const [several, setSeveral] = useState<readonly string[]>(["ord-1001", "ord-1004"]);
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useTableColumns();
  const chosen = (keys: readonly string[]) =>
    keys.length === 0 ? t(K.none) : t(K.chosen, { keys: keys.join(", ") });
  return (
    <View className="gap-3">
      <Table
        label={t(K.single)}
        items={TABLE_ORDERS.slice(0, 3)}
        columns={columns}
        renderCell={renderCell}
        selectionMode="single"
        selectedKeys={one}
        onSelectionChange={setOne}
        scrollEnabled={false}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen(one)}
      </Text>
      <Table
        label={t(K.multiple)}
        items={TABLE_ORDERS.slice(0, 3)}
        columns={columns}
        renderCell={renderCell}
        selectionMode="multiple"
        selectedKeys={several}
        onSelectionChange={setSeveral}
        scrollEnabled={false}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen(several)}
      </Text>
    </View>
  );
}
