/**
 * Stackra file contract:
 * Purpose: the "sheet" demo of the native Menu: `presentation="bottom-sheet"` opens it as a sheet instead of a popover.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_DEMO_KEYS } from "#src/demos/free/menu/menu-demo-keys.constant";

/** The demo's keys. */
const K = MENU_DEMO_KEYS.demo_free.menu.basics;
const S = MENU_DEMO_KEYS.demo_free.menu.sheet;

/** The basic menu as a bottom sheet. */
export default function Sheet() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "file",
      title: t(K.file),
      items: [
        { id: "new", label: t(K.new_file) },
        { id: "open", label: t(K.open_file) },
      ],
    },
    {
      id: "danger",
      title: t(K.danger),
      items: [{ id: "delete", label: t(K.delete), tone: "danger" }],
    },
  ];
  return (
    <Menu sections={sections} presentation="bottom-sheet">
      <Button variant="secondary">{t(S.open)}</Button>
    </Menu>
  );
}
