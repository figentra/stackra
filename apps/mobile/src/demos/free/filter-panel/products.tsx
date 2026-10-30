/**
 * Stackra file contract:
 * Purpose: the "products" demo of the native FilterPanel: a POS product catalogue with no saved views: category counts, an in-stock filter, a price range in riyals and a sort.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import type { FilterDefinition, ResourceQuery } from "@stackra/ui/contracts";
import { FilterPanel, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_PANEL_DEMO_KEYS } from "#src/demos/free/filter-panel/filter-panel-demo-keys.constant";

/** The demo's keys. */
const K = FILTER_PANEL_DEMO_KEYS.demo_free.filter_panel.products;

/** Drinks picked at the start. */
const START: ResourceQuery = { search: "", filterValues: { category: ["drinks"] }, sort: null };

/** The catalogue's facets and sort. */
export default function Products() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState(START);
  const filters: readonly FilterDefinition[] = [
    {
      id: "category",
      label: t(K.category),
      kind: "multi-select",
      options: (["drinks", "food", "merch"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    { id: "in_stock", label: t(K.in_stock), kind: "boolean" },
    {
      id: "price",
      label: t(K.price),
      kind: "number",
      formatOptions: { style: "currency", currency: "SAR" },
    },
  ];
  return (
    <FilterPanel
      label={t(K.label)}
      query={query}
      onQueryChange={setQuery}
      filters={filters}
      counts={{ category: { drinks: 42, food: 67, merch: 8 } }}
      resultCount={42}
      sortOptions={[
        { column: "name", label: t(K.name) },
        { column: "price", label: t(K.price) },
      ]}
    />
  );
}
