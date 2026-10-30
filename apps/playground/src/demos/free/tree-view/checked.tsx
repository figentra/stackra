/**
 * Stackra file contract:
 * Purpose: the "checked" demo of the web Tree view: a cashier's permissions as a tree of checkboxes; ticking a group ticks every permission under it, and a group with only some ticked shows a dash.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { Text, TreeView, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_KEYS } from "#src/demos/free/tree-view/tree-view-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_KEYS.tree_view.checked;

/** Tree view: permissions with propagating checkboxes. */
export default function Checked() {
  const t = useCatalogueText(MESSAGES.en);
  const [granted, setGranted] = useState<readonly string[]>(["orders_view"]);
  // The groups are ticked by their permissions; count the permissions only.
  const leaves = granted.filter((id) => id !== "orders" && id !== "catalogue");
  return (
    <div className="grid max-w-md gap-3">
      <TreeView
        label={t(K.label)}
        selectionMode="multiple"
        isSelectionPropagated
        selectedKeys={granted}
        onSelectionChange={setGranted}
        defaultExpandedKeys={["orders", "catalogue"]}
        items={[
          {
            id: "orders",
            label: t(K.orders),
            children: [
              { id: "orders_view", label: t(K.orders_view) },
              { id: "orders_refund", label: t(K.orders_refund) },
            ],
          },
          {
            id: "catalogue",
            label: t(K.catalogue),
            children: [
              { id: "catalogue_edit", label: t(K.catalogue_edit) },
              { id: "catalogue_prices", label: t(K.catalogue_prices) },
            ],
          },
          { id: "reports", label: t(K.reports) },
        ]}
      />
      <Text tone="muted" aria-live="polite">
        {t(K.summary, { count: leaves.length })}
      </Text>
    </div>
  );
}
