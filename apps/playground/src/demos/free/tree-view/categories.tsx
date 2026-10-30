/**
 * Stackra file contract:
 * Purpose: the "categories" demo of the web Tree view: picks several product categories with a checkbox per row; the count under the tree follows the selection.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { Text, TreeView, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_KEYS } from "#src/demos/free/tree-view/tree-view-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_KEYS.tree_view.categories;

/** Category groups and their categories. */
const CATEGORIES = [
  ["beverages", ["coffee", "tea", "juices"]],
  ["bakery", ["bread", "pastries"]],
] as const;

/** Tree view: Category picker. */
export default function Categories() {
  const t = useCatalogueText(MESSAGES.en);
  const [selected, setSelected] = useState<readonly string[]>(["coffee"]);
  return (
    <div className="grid max-w-md gap-3">
      <TreeView
        label={t(K.label)}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        defaultExpandedKeys={["beverages"]}
        items={CATEGORIES.map(([id, children]) => ({
          id,
          label: t(K[id]),
          children: children.map((child) => ({ id: child, label: t(K[child]) })),
        }))}
      />
      <Text tone="muted" aria-live="polite">
        {t(K.selected, { count: selected.length })}
      </Text>
    </div>
  );
}
