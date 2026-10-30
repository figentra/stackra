/**
 * Stackra file contract:
 * Purpose: the "drag" demo of the web Tree view: a café menu whose items are dragged by their handle (or moved from the keyboard) between and into sections; `moveTreeNodes` applies each move.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { moveTreeNodes } from "@stackra/ui";
import type { TreeViewNode } from "@stackra/ui/contracts";
import { Text, TreeView, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_KEYS } from "#src/demos/free/tree-view/tree-view-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_KEYS.tree_view.drag;

/** The menu's sections and items, by key. */
const MENU = [
  ["hot", ["espresso", "latte"]],
  ["cold", ["iced_latte", "lemonade"]],
  ["sweets", []],
] as const;

/** Tree view: rows moved by dragging. */
export default function Drag() {
  const t = useCatalogueText(MESSAGES.en);
  const [items, setItems] = useState<readonly TreeViewNode[]>(() =>
    MENU.map(([id, children]) => ({
      id,
      label: t(K[id]),
      children: children.map((child) => ({ id: child, label: t(K[child]) })),
    })),
  );
  return (
    <div className="grid max-w-md gap-3">
      <TreeView
        label={t(K.label)}
        items={items}
        defaultExpandedKeys={["hot", "cold", "sweets"]}
        onMove={(ids, target) => setItems((now) => moveTreeNodes(now, ids, target))}
      />
      <Text tone="muted">{t(K.hint)}</Text>
    </div>
  );
}
