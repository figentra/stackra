/**
 * Stackra file contract:
 * Purpose: the "accounts" demo of the web Tree view: a chart of accounts as a tree table: each row carries its account code, and Assets starts open.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { TreeView, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_VIEW_KEYS } from "#src/demos/free/tree-view/tree-view-keys.constant";

/** The demo's keys. */
const K = TREE_VIEW_KEYS.tree_view.accounts;

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

/** Tree view: Chart of accounts. */
export default function Accounts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TreeView
      label={t(K.label)}
      defaultExpandedKeys={["assets"]}
      className="max-w-md"
      items={CHART.map(([id, code, children]) => ({
        id,
        label: t(K[id]),
        description: code,
        icon: Icons.Folder,
        children: children.map(([child, childCode]) => ({
          id: child,
          label: t(K[child]),
          description: childCode,
        })),
      }))}
    />
  );
}
