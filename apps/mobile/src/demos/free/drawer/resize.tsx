/**
 * Stackra file contract:
 * Purpose: the "resize" demo of the native Drawer: a sheet with three snap points whose grab bar resizes it, by a drag
 *          or, with VoiceOver or TalkBack, by swiping up or down on the focused handle.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (drawer resize on native).
 */
import { Button, Drawer, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.resize;

/** Half, most and all of the screen. */
const SNAP_POINTS = ["50%", "75%", "95%"] as const;

/** A sheet resized by its handle. */
export default function Resize() {
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
