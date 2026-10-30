/**
 * Stackra file contract:
 * Purpose: the "lazy" demo of the native TreeView: regions whose branches load the first time a region opens, with a loading row while they come (a timer stands in for the server).
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner request 2026-10-29).
 */
import type { TreeViewNode } from "@stackra/ui/contracts";
import { TreeView, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_DEMO_KEYS } from "#src/demos/free/tree-view/tree-view-demo-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_DEMO_KEYS.demo_free.tree_view.lazy;

/** The branches of each region, as the server would answer. */
const BRANCHES = {
  central: ["olaya", "malqa"],
  western: ["tahlia", "aziziyah"],
  eastern: ["dammam", "khobar"],
} as const;

/** TreeView: branches loaded per region. */
export default function Lazy() {
  const t = useCatalogueText(MESSAGES.en);
  const load = (id: string) =>
    new Promise<readonly TreeViewNode[]>((resolve) => {
      const branches = BRANCHES[id as keyof typeof BRANCHES];
      setTimeout(() => resolve(branches.map((key) => ({ id: key, label: t(K[key]) }))), 900);
    });
  return (
    <TreeView
      label={t(K.label)}
      onLoadChildren={load}
      items={(["central", "western", "eastern"] as const).map((id) => ({
        id,
        label: t(K[id]),
        hasChildren: true,
      }))}
    />
  );
}
