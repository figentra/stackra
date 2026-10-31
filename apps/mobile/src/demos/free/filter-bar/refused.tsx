/**
 * Stackra file contract:
 * Purpose: the "refused" demo of the native FilterBar: a column with `isFilterable: false` is left out of the add-filter list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0505.
 */
import type { CollectionColumn } from "@stackra/ui/contracts";
import { FilterBar, Text, useCatalogueText, useCollection } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_DEMO_KEYS } from "#src/demos/free/filter-bar/filter-bar-demo-keys.constant";

import { useOrderFilters } from "#src/demos/free/filter-bar/use-order-filters";

/** The demo's keys. */
const K = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar.bar;
const F = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar.filters;

/** Region is a column of the orders but not a filter: the bar offers the first three columns only. */
export default function Refused() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, readout } = useOrderFilters();
  const withRegion: readonly CollectionColumn[] = [
    ...columns.slice(0, 3),
    { id: "region", label: t(F.region), isFilterable: false },
  ];
  const collection = useCollection({ columns: withRegion });
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
