/**
 * Stackra file contract:
 * Purpose: the "idle" demo of the native Kiosk surface: an attract screen that resets after 8 seconds untouched; the count of
 *          resets is announced politely.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-1371.
 */
import { Button, KioskSurface, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { KIOSK_SURFACE_DEMO_KEYS } from "#src/demos/free/kiosk-surface/kiosk-surface-demo-keys.constant";

/** The demo's keys. */
const K = KIOSK_SURFACE_DEMO_KEYS.demo_free.kiosk_surface.sample;

/** Kiosk surface: Idle reset. */
export default function Idle() {
  const t = useCatalogueText(MESSAGES.en);
  const [resets, setResets] = useState(0);
  return (
    <View className="h-72 rounded-[var(--radius-container)] border border-dashed border-border">
      <KioskSurface idleTimeoutMs={8000} onIdle={() => setResets((count) => count + 1)}>
        <View className="items-start gap-4 p-4">
          <Text>{t(K.welcome)}</Text>
          <Button>{t(K.start)}</Button>
          <Text type="small" tone="muted" accessibilityLiveRegion="polite">
            {t(K.resets, { count: resets })}
          </Text>
        </View>
      </KioskSurface>
    </View>
  );
}
