/**
 * Stackra file contract:
 * Purpose: the "locked" demo of the native FullscreenBar: a kitchen display: locked, so once hidden only a long press at the top edge (the manager gesture) brings the bar back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 32 (owner decision 2026-10-28).
 */
import { Button, FullscreenBar, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FULLSCREEN_BAR_DEMO_KEYS } from "#src/demos/free/fullscreen-bar/fullscreen-bar-demo-keys.constant";

/** The demo's keys. */
const K = FULLSCREEN_BAR_DEMO_KEYS.demo_free.fullscreen_bar;

/** Locked: only a long press at the top edge brings the bar back. */
export default function Locked() {
  const t = useCatalogueText(MESSAGES.en);
  const [isFull, setFull] = useState(true);
  return (
    <View className="h-72 overflow-hidden border border-separator bg-background">
      {isFull ? (
        <>
          <View className="flex-1 items-center justify-center gap-2 p-6">
            <Text>{t(K.locked.tickets, { count: 7 })}</Text>
            <Text tone="muted" type="small">
              {t(K.locked.hint)}
            </Text>
          </View>
          <FullscreenBar
            title={t(K.locked.title)}
            autoHideMs={2000}
            isLocked
            onExit={() => setFull(false)}
          />
        </>
      ) : (
        <View className="flex-1 items-center justify-center gap-3">
          <Text>{t(K.exited)}</Text>
          <Button size="sm" variant="secondary" onPress={() => setFull(true)}>
            {t(K.enter_again)}
          </Button>
        </View>
      )}
    </View>
  );
}
