/**
 * Stackra file contract:
 * Purpose: the "accounts" demo of the native TreeView: a chart of accounts with each account's code; Assets starts open and the chevrons mirror in Arabic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { TreeView, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_DEMO_KEYS } from "#src/demos/free/tree-view/tree-view-demo-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_DEMO_KEYS.demo_free.tree_view.accounts;

/** Account groups and their accounts, with their codes. */
const CHART = [
  [
    "assets",
    "1000",
    [
      ["cash", "1100"],
      ["bank", "1200"],
      ["receivables", "1300"],
    ],
  ],
  [
    "liabilities",
    "2000",
    [
      ["payables", "2100"],
      ["vat", "2200"],
    ],
  ],
  [
    "revenue",
    "4000",
    [
      ["sales", "4100"],
      ["services", "4200"],
    ],
  ],
] as const;

/** The accounts as a tree, Assets open. */
export default function Accounts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TreeView
      label={t(K.label)}
      defaultExpandedKeys={["assets"]}
      items={CHART.map(([id, code, children]) => ({
        id,
        label: t(K[id]),
        description: code,
        children: children.map(([child, childCode]) => ({
          id: child,
          label: t(K[child]),
          description: childCode,
        })),
      }))}
    />
  );
}
