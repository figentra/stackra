/**
 * Stackra file contract:
 * Purpose: the "items" demo of the native Menu: icons, a second line, and an action shown but refused with its reason.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu, useCatalogueText } from "@stackra/ui/native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_DEMO_KEYS } from "#src/demos/free/menu/menu-demo-keys.constant";

/** The demo's keys. */
const I = MENU_DEMO_KEYS.demo_free.menu.items;

/** The reason replaces the refused action's description. */
export default function Items() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "file",
      title: t(I.group),
      isTitleHidden: true,
      items: [
        { id: "edit", label: t(I.edit), description: t(I.edit_note), icon: Icons.Pencil },
        { id: "duplicate", label: t(I.duplicate), icon: Icons.Copy },
        {
          id: "archive",
          label: t(I.archive),
          icon: Icons.Archive,
          isDisabled: true,
          disabledReason: t(I.archive_reason),
        },
        { id: "delete", label: t(I.delete), icon: Icons.Trash, tone: "danger" },
      ],
    },
  ];
  return (
    <Menu sections={sections}>
      <Button variant="secondary">{t(I.open)}</Button>
    </Menu>
  );
}
