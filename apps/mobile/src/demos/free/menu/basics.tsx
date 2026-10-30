/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Menu: any pressable element is the trigger; the menu lists its groups.
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

/** Two groups: the file actions, then the destructive one. */
export default function Basics() {
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
    <Menu sections={sections}>
      <Button variant="secondary">{t(K.open)}</Button>
    </Menu>
  );
}
