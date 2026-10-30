/**
 * Stackra file contract:
 * Purpose: the "tickets" demo of the web Filter panel: an admin's support tickets: saved views and priority facets with counts, no sort menu.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import type { FilterDefinition, ResourceQuery, SavedView } from "@stackra/ui/contracts";
import { FilterPanel, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_PANEL_KEYS } from "#src/demos/free/filter-panel/filter-panel-keys.constant";

/** The demo's keys. */
const K = FILTER_PANEL_KEYS.filter_panel.tickets;

/** Open tickets of every priority. */
const OPEN: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** Filter panel: Support tickets. */
export default function Tickets() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState(OPEN);
  const [view, setView] = useState("open");
  const filters: readonly FilterDefinition[] = [
    {
      id: "priority",
      label: t(K.priority),
      kind: "select",
      options: (["high", "normal", "low"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    { id: "mine", label: t(K.mine), kind: "boolean" },
  ];
  const views: readonly SavedView[] = [
    { id: "open", label: t(K.open), query: OPEN },
    { id: "mine", label: t(K.view_mine), query: { ...OPEN, filterValues: { mine: true } } },
    { id: "closed", label: t(K.closed), query: OPEN },
  ];
  return (
    <FilterPanel
      label={t(K.label)}
      query={query}
      onQueryChange={setQuery}
      filters={filters}
      counts={{ priority: { high: 3, normal: 17, low: 6 } }}
      resultCount={26}
      views={views}
      activeViewId={view}
      onViewChange={setView}
    />
  );
}
