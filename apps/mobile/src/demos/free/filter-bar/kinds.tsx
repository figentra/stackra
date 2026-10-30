/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the native FilterBar: one filter of each kind, each with its own editor in one sheet.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceQuery } from "@stackra/ui/contracts";
import { FilterBar, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_DEMO_KEYS } from "#src/demos/free/filter-bar/filter-bar-demo-keys.constant";

import { useOrderFilters } from "#src/demos/free/filter-bar/use-order-filters";

/** The demo's keys. */
const K = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar.bar;

/** Add a filter from the list; its chip edits or removes it. */
export default function Kinds() {
  const [query, setQuery] = useState<ResourceQuery>({ search: "", filterValues: {}, sort: null });
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
