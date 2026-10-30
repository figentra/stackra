/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the native FilterPanel: a commerce order index on a phone: saved views, a sort menu, a drawer of facets with live counts from the sample orders, chips and a rolling result count.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import type { FilterDefinition, ResourceQuery, SavedView } from "@stackra/ui/contracts";
import { FilterPanel, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_PANEL_DEMO_KEYS } from "#src/demos/free/filter-panel/filter-panel-demo-keys.constant";

/** The demo's keys. */
const K = FILTER_PANEL_DEMO_KEYS.demo_free.filter_panel.orders;

/** Sample orders: payment status and channel. */
const ORDERS = [
  ["paid", "online"],
  ["paid", "in_store"],
  ["unpaid", "online"],
  ["refunded", "online"],
  ["paid", "online"],
  ["unpaid", "in_store"],
  ["paid", "in_store"],
] as const;

/** Nothing filtered, newest first. */
const ALL: ResourceQuery = {
  search: "",
  filterValues: {},
  sort: { column: "date", direction: "descending" },
};

/** The panel over the sample orders. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState(ALL);
  const [view, setView] = useState("all");
  const filters: readonly FilterDefinition[] = [
    {
      id: "status",
      label: t(K.status),
      kind: "multi-select",
      options: (["paid", "unpaid", "refunded"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    {
      id: "channel",
      label: t(K.channel),
      kind: "select",
      options: (["online", "in_store"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
  ];
  const views: readonly SavedView[] = [
    { id: "all", label: t(K.all), query: ALL },
    {
      id: "unpaid",
      label: t(K.view_unpaid),
      query: { ...ALL, filterValues: { status: ["unpaid"] } },
    },
    {
      id: "refunds",
      label: t(K.view_refunds),
      query: { ...ALL, filterValues: { status: ["refunded"] } },
    },
  ];
  const status = query.filterValues["status"];
  const channel = query.filterValues["channel"];
  const matches = ORDERS.filter(
    ([s, c]) =>
      (!Array.isArray(status) || status.length === 0 || status.includes(s)) &&
      (typeof channel !== "string" || channel === c),
  );
  const countBy = (index: 0 | 1) =>
    Object.fromEntries(
      [...new Set(ORDERS.map((order) => order[index]))].map((key) => [
        key,
        ORDERS.filter((order) => order[index] === key).length,
      ]),
    );
  return (
    <FilterPanel
      label={t(K.label)}
      query={query}
      onQueryChange={setQuery}
      filters={filters}
      counts={{ status: countBy(0), channel: countBy(1) }}
      resultCount={matches.length}
      views={views}
      activeViewId={view}
      onViewChange={setView}
      sortOptions={[
        { column: "date", label: t(K.date) },
        { column: "total", label: t(K.total) },
        { column: "customer", label: t(K.customer) },
      ]}
    />
  );
}
