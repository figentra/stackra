/**
 * Stackra file contract:
 * Purpose: the "applied" demo of the native FilterBar: the query starts with a filter of every kind set.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0505.
 */
import { getLocalTimeZone, startOfMonth, today } from "@internationalized/date";
import { FilterBar, Text, useCatalogueText, useCollection } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_DEMO_KEYS } from "#src/demos/free/filter-bar/filter-bar-demo-keys.constant";

import { useOrderFilters } from "#src/demos/free/filter-bar/use-order-filters";

/** The demo's keys. */
const K = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar.bar;

/** Each applied filter is a chip (the condition a quick filter keeps, id `filter:<column>`); Clear all removes them. */
export default function Applied() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, readout } = useOrderFilters();
  const now = today(getLocalTimeZone());
  const collection = useCollection({
    columns,
    initialState: {
      filter: {
        match: "all",
        conditions: [
          { id: "filter:customer", field: "customer", operator: "contains", value: "Ada" },
          { id: "filter:total", field: "total", operator: "between", value: ["100", ""] },
          { id: "filter:status", field: "status", operator: "in", value: ["paid"] },
          { id: "filter:channels", field: "channels", operator: "in", value: ["web", "store"] },
          {
            id: "filter:placed",
            field: "placed",
            operator: "between",
            value: [startOfMonth(now).toString(), now.toString()],
          },
          { id: "filter:gift", field: "gift", operator: "is_true", value: "" },
        ],
      },
    },
  });
  const lines = readout(collection.state);
  return (
    <View className="gap-3">
      <FilterBar
        collection={collection}
        searchLabel={t(K.search_label)}
        searchPlaceholder={t(K.search_placeholder)}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {lines.search}
      </Text>
      <Text tone="muted">{lines.filters}</Text>
    </View>
  );
}
