/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native ActionMenu: a button named for what it acts on, opening two groups of actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { ActionMenu, useCatalogueText } from "@stackra/ui/native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACTION_MENU_DEMO_KEYS } from "#src/demos/free/action-menu/action-menu-demo-keys.constant";

/** The demo's keys. */
const M = ACTION_MENU_DEMO_KEYS.demo_free.action_menu.menu;
const K = ACTION_MENU_DEMO_KEYS.demo_free.action_menu.basics;
/** Two groups: the everyday actions, then the destructive one. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "actions",
      title: t(M.actions),
      isTitleHidden: true,
      items: [
        { id: "open", label: t(M.open) },
        { id: "edit", label: t(M.edit), icon: Icons.Pencil },
        { id: "duplicate", label: t(M.duplicate), icon: Icons.Copy },
        { id: "archive", label: t(M.archive), icon: Icons.Archive },
      ],
    },
    {
      id: "danger",
      title: t(M.danger),
      isTitleHidden: true,
      items: [{ id: "delete", label: t(M.delete), icon: Icons.Trash, tone: "danger" }],
    },
  ];
  return <ActionMenu label={t(K.label)} sections={sections} />;
}
