/**
 * Stackra file contract:
 * Purpose: the "org" demo of the native TreeView: an organisation chart three levels deep; pressing a row opens it, written under the tree.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import type { TreeViewNode } from "@stackra/ui/contracts";
import { Text, TreeView, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_DEMO_KEYS } from "#src/demos/free/tree-view/tree-view-demo-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_DEMO_KEYS.demo_free.tree_view.org;

/** A department or team by its key, with the units under it. */
interface Unit {
  readonly id: keyof typeof K;
  readonly children?: readonly Unit[];
}

/** The departments and teams, nested. */
const ORG: Unit = {
  id: "company",
  children: [
    { id: "operations", children: [{ id: "riyadh" }, { id: "jeddah" }] },
    { id: "finance", children: [{ id: "payroll" }] },
    { id: "it" },
  ],
};

/** The chart, and the unit last opened. */
export default function Org() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState<string | null>(null);
  const nodeOf = (unit: Unit): TreeViewNode => ({
    id: unit.id,
    label: t(K[unit.id]),
    ...(unit.children ? { children: unit.children.map(nodeOf) } : {}),
  });
  return (
    <View className="gap-3">
      <TreeView
        label={t(K.label)}
        defaultExpandedKeys={["company", "operations"]}
        onAction={setOpened}
        items={[nodeOf(ORG)]}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {opened === null ? t(K.none) : t(K.opened, { name: t(K[opened as Unit["id"]]) })}
      </Text>
    </View>
  );
}
