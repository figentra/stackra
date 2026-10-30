/**
 * Stackra file contract:
 * Purpose: the "snap" demo of the web Drawer: a bottom drawer with two snap points, a peek and most of the screen;
 *          its handle steps between them and a drag down closes it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0329 (motion layer); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, Drawer, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** A peek of 280 px, then most of the screen. */
const SNAP_POINTS = [280, "85%"] as const;

/** Drawer: Snap points. */
export default function Snap() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Drawer
      placement="bottom"
      snapPoints={SNAP_POINTS}
      trigger={<Button variant="secondary">{t(K.open_snap)}</Button>}
    >
      <Drawer.Header>
        <Drawer.Title>{t(K.snap_title)}</Drawer.Title>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.Body>
        <Text>{t(K.snap_body)}</Text>
      </Drawer.Body>
    </Drawer>
  );
}
