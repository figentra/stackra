/**
 * Stackra file contract:
 * Purpose: the "snap" demo of the native Drawer: a sheet with two snap points, a peek and most of the screen; drag it
 *          between them, or down past the peek to close it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import { Button, Drawer, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.snap;

/** A peek of 280 points, then most of the screen. */
const SNAP_POINTS = [280, "85%"] as const;

/** A sheet that rests at a peek or high. */
export default function Snap() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start">
      <Drawer
        snapPoints={SNAP_POINTS}
        trigger={
          <Button variant="secondary" size="sm">
            {t(K.open)}
          </Button>
        }
      >
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>{t(K.body)}</Drawer.Body>
      </Drawer>
    </View>
  );
}
