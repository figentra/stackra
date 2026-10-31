/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the web Filter panel: a commerce order index: saved views as tabs (`SavedViews`) and
 *          the facets with live counts from the sample orders, clearable chips and a result count that rolls, all on
 *          one engine.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0505 (one filter model, one SavedViews); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn, CollectionView } from "@stackra/ui/contracts";
import { FilterPanel, SavedViews, useCatalogueText, useCollection } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_PANEL_KEYS } from "#src/demos/free/filter-panel/filter-panel-keys.constant";

/** The demo's keys. */
const K = FILTER_PANEL_KEYS.filter_panel.orders;

/** Sample orders: payment status, channel and total. */
const ORDERS = (
  [
    ["paid", "online", 240],
    ["paid", "in_store", 85],
    ["unpaid", "online", 410],
    ["refunded", "online", 60],
    ["paid", "online", 1290],
    ["unpaid", "in_store", 35],
    ["paid", "in_store", 150],
  ] as const
).map(([status, channel, total], index) => ({ id: `o${index}`, status, channel, total }));

/** How many orders hold each value of a column, for the facet counts. */
const countBy = (key: "status" | "channel") =>
  Object.fromEntries(
    [...new Set(ORDERS.map((order) => order[key]))].map((value) => [
      value,
      ORDERS.filter((order) => order[key] === value).length,
    ]),
  );

/** A view that keeps only one status. */
const statusView = (id: string, label: string, status: string): CollectionView => ({
  id,
  label,
  state: {
    filter: {
      match: "all",
      conditions: [{ id: "filter:status", field: "status", operator: "in", value: [status] }],
    },
  },
});

/** Filter panel: Orders. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly CollectionColumn[] = [
    {
      id: "status",
      label: t(K.status),
      type: "choice",
      options: (["paid", "unpaid", "refunded"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    {
      id: "channel",
      label: t(K.channel),
      type: "choice",
      options: (["online", "in_store"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    { id: "total", label: t(K.total), type: "number" },
  ];
  const collection = useCollection({
    columns,
    items: ORDERS,
    views: [
      { id: "all", label: t(K.all), state: { filter: { match: "all", conditions: [] } } },
      statusView("unpaid", t(K.view_unpaid), "unpaid"),
      statusView("refunds", t(K.view_refunds), "refunded"),
    ],
    defaultViewId: "all",
  });
  return (
    <div className="grid gap-3">
      <SavedViews collection={collection} variant="tabs" label={t(K.label)} />
      <FilterPanel
        label={t(K.label)}
        collection={collection}
        counts={{ status: countBy("status"), channel: countBy("channel") }}
      />
    </div>
  );
}
