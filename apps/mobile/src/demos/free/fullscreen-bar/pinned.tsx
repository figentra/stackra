/**
 * Stackra file contract:
 * Purpose: the "pinned" demo of the native FullscreenBar: a full-screen invoice editor whose bar never hides, with a Save action and an Arabic title.
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

/** A bar that never hides. */
export default function Pinned() {
  const t = useCatalogueText(MESSAGES.en);
  const [isFull, setFull] = useState(true);
  return (
    <View className="h-72 overflow-hidden border border-separator bg-background">
      {isFull ? (
        <>
          <View className="flex-1 p-6 pt-24">
            <Text>{t(K.pinned.body)}</Text>
          </View>
          <FullscreenBar
            title={t(K.pinned.title)}
            autoHideMs={false}
            actions={<Button size="sm">{t(K.pinned.save)}</Button>}
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
