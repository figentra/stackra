/**
 * Stackra file contract:
 * Purpose: the "applied" demo of the native FilterBar: the query starts with a filter of every kind set.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { getLocalTimeZone, startOfMonth, today } from "@internationalized/date";
import type { ResourceQuery } from "@stackra/ui/contracts";
import { FilterBar, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_DEMO_KEYS } from "#src/demos/free/filter-bar/filter-bar-demo-keys.constant";

import { useOrderFilters } from "#src/demos/free/filter-bar/use-order-filters";

/** The demo's keys. */
const K = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar.bar;

/** Each applied filter is a chip; Clear all removes them together. */
export default function Applied() {
  const [query, setQuery] = useState<ResourceQuery>(() => {
    const now = today(getLocalTimeZone());
    return {
      search: "",
      sort: null,
      filterValues: {
        customer: "Ada",
        total: { min: 100, max: null },
        status: "paid",
        channels: ["web", "store"],
        placed: { start: startOfMonth(now), end: now },
        gift: true,
      },
    };
  });
  const t = useCatalogueText(MESSAGES.en);
  const { filters, readout } = useOrderFilters();
  const lines = readout(query);
  return (
    <View className="gap-3">
      <FilterBar
        filters={filters}
        query={query}
        onQueryChange={setQuery}
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
