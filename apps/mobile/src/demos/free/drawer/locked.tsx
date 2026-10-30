/**
 * Stackra file contract:
 * Purpose: the "locked" demo of the native Drawer: `isDismissable` off, so the drawer holds its own way out.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Drawer, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.locked;

/** A swipe or a press outside does nothing; only Done closes it. */
export default function Locked() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} isDismissable={false}>
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>{t(K.body)}</Drawer.Body>
        <Drawer.Footer>
          <Button onPress={() => setIsOpen(false)}>{t(K.done)}</Button>
        </Drawer.Footer>
      </Drawer>
    </>
  );
}
