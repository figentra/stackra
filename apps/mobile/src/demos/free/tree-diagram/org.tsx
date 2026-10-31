/**
 * Stackra file contract:
 * Purpose: the "org" demo of the native TreeDiagram: headcount by team: the company, its departments and their teams, each branch in its colour.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap wave, owner approval 2026-10-31).
 */
import { TreeDiagram, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_DIAGRAM_DEMO_KEYS } from "#src/demos/free/tree-diagram/tree-diagram-demo-keys.constant";

/** The demo's keys. */
const K = TREE_DIAGRAM_DEMO_KEYS.demo_free.tree_diagram.org;

/** The teams and their headcount. */
const TREE = {
  key: "company",
  children: [
    {
      key: "operations",
      children: [
        { key: "riyadh", value: 24 },
        { key: "jeddah", value: 18 },
      ],
    },
    {
      key: "technology",
      children: [
        { key: "platform", value: 12 },
        { key: "mobile", value: 9 },
        { key: "data", value: 6 },
      ],
    },
    {
      key: "sales",
      children: [
        { key: "retail", value: 15 },
        { key: "wholesale", value: 7 },
      ],
    },
  ],
} as const;

/** Tree diagram: org. */
export default function Org() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TreeDiagram
      label={t(K.label)}
      items={[
        {
          key: TREE.key,
          label: t(K[TREE.key]),
          children: TREE.children.map((team) => ({
            key: team.key,
            label: t(K[team.key]),
            children: team.children.map((leaf) => ({ ...leaf, label: t(K[leaf.key]) })),
          })),
        },
      ]}
    />
  );
}
