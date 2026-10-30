/**
 * Stackra file contract:
 * Purpose: the "submenu" demo of the native Menu: an action that carries `items` opens a second menu one level deep.
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
const K = MENU_DEMO_KEYS.demo_free.menu.submenu;

/** Copy link, or share to another app. */
export default function Submenu() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "share",
      title: t(K.group),
      isTitleHidden: true,
      items: [
        { id: "copy", label: t(K.copy), icon: Icons.Copy },
        {
          id: "share",
          label: t(K.share),
          items: [
            { id: "mail", label: t(K.mail) },
            { id: "chat", label: t(K.chat) },
          ],
        },
      ],
    },
  ];
  return (
    <Menu sections={sections}>
      <Button variant="secondary">{t(K.open)}</Button>
    </Menu>
  );
}
