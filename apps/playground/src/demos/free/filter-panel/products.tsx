/**
 * Stackra file contract:
 * Purpose: the "products" demo of the web Filter panel: a POS product catalogue with no saved views: category counts,
 *          an in-stock switch and a price range, the facets derived from the catalogue's columns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0505 (one filter model); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn } from "@stackra/ui/contracts";
import { FilterPanel, useCatalogueText, useCollection } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_PANEL_KEYS } from "#src/demos/free/filter-panel/filter-panel-keys.constant";

/** The demo's keys. */
const K = FILTER_PANEL_KEYS.filter_panel.products;

/** Filter panel: Product catalogue. */
export default function Products() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly CollectionColumn[] = [
    {
      id: "category",
      label: t(K.category),
      type: "choice",
      options: (["drinks", "food", "merch"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    { id: "in_stock", label: t(K.in_stock), type: "boolean" },
    { id: "price", label: t(K.price), type: "number", min: 0 },
  ];
  // Server mode: the catalogue lives on the server, which answers the count; drinks are picked at the start.
  const collection = useCollection({
    columns,
    mode: "server",
    totalCount: 42,
    initialState: {
      filter: {
        match: "all",
        conditions: [
          { id: "filter:category", field: "category", operator: "in", value: ["drinks"] },
        ],
      },
    },
  });
  return (
    <FilterPanel
      label={t(K.label)}
      collection={collection}
      counts={{ category: { drinks: 42, food: 67, merch: 8 } }}
    />
  );
}
