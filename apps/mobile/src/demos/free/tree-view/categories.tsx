/**
 * Stackra file contract:
 * Purpose: the "categories" demo of the native TreeView: picks several product categories, with a selection haptic; the count under the tree follows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { Text, TreeView, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_DEMO_KEYS } from "#src/demos/free/tree-view/tree-view-demo-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_DEMO_KEYS.demo_free.tree_view.categories;

/** Category groups and their categories. */
const CATEGORIES = [
  ["beverages", ["coffee", "tea", "juices"]],
  ["bakery", ["bread", "pastries"]],
] as const;

/** Several categories picked, the count written under the tree. */
export default function Categories() {
  const t = useCatalogueText(MESSAGES.en);
  const [selected, setSelected] = useState<readonly string[]>(["coffee"]);
  return (
    <View className="gap-3">
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
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.selected, { count: selected.length })}
      </Text>
    </View>
  );
}
