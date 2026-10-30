/**
 * Stackra file contract:
 * Purpose: the "refused" demo of the native ActionMenu: an action with a second line, and one shown but refused with its reason.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { ActionMenu, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ACTION_MENU_DEMO_KEYS } from "#src/demos/free/action-menu/action-menu-demo-keys.constant";

/** The demo's keys. */
const M = ACTION_MENU_DEMO_KEYS.demo_free.action_menu.menu;
const K = ACTION_MENU_DEMO_KEYS.demo_free.action_menu.refused;

/** `description` on an action; `disabledReason` replaces it on a refused one. */
export default function Refused() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "invoice",
      title: t(M.actions),
      isTitleHidden: true,
      items: [
        { id: "send", label: t(K.send), description: t(K.send_note) },
        { id: "refund", label: t(K.refund), isDisabled: true, disabledReason: t(K.refund_reason) },
      ],
    },
  ];
  return <ActionMenu label={t(K.label)} sections={sections} />;
}
