/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Drawer: a trigger opens it; its close button, a swipe or a press outside closes it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Drawer, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.basics;

/** The drawer holds its own open state. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Drawer trigger={<Button variant="secondary">{t(K.open)}</Button>}>
      <Drawer.Header>
        <Drawer.Title>{t(K.heading)}</Drawer.Title>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.Body>{t(K.body)}</Drawer.Body>
    </Drawer>
  );
}
