/**
 * Stackra file contract:
 * Purpose: the "tickets" demo of the web Filter panel: an admin's support tickets: saved views as tabs (`SavedViews`)
 *          and priority facets with counts, on one engine.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0505 (one filter model, one SavedViews); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn } from "@stackra/ui/contracts";
import { FilterPanel, SavedViews, useCatalogueText, useCollection } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_PANEL_KEYS } from "#src/demos/free/filter-panel/filter-panel-keys.constant";

/** The demo's keys. */
const K = FILTER_PANEL_KEYS.filter_panel.tickets;

/** Filter panel: Support tickets. */
export default function Tickets() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly CollectionColumn[] = [
    {
      id: "priority",
      label: t(K.priority),
      type: "choice",
      options: (["high", "normal", "low"] as const).map((id) => ({ id, label: t(K[id]) })),
    },
    { id: "mine", label: t(K.mine), type: "boolean" },
  ];
  const none = { match: "all", conditions: [] } as const;
  const collection = useCollection({
    columns,
    mode: "server",
    totalCount: 26,
    views: [
      { id: "open", label: t(K.open), state: { filter: none } },
      {
        id: "mine",
        label: t(K.view_mine),
        state: {
          filter: {
            match: "all",
            conditions: [{ id: "filter:mine", field: "mine", operator: "is_true", value: "" }],
          },
        },
      },
      { id: "closed", label: t(K.closed), state: { filter: none } },
    ],
    defaultViewId: "open",
  });
  return (
    <div className="grid gap-3">
      <SavedViews collection={collection} variant="tabs" label={t(K.label)} />
      <FilterPanel
        label={t(K.label)}
        collection={collection}
        counts={{ priority: { high: 3, normal: 17, low: 6 } }}
      />
    </div>
  );
}
