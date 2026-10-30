/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native IconButton: a press counter, and a load that holds its press for a moment.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { IconButton, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_BUTTON_DEMO_KEYS } from "#src/demos/free/icon-button/icon-button-demo-keys.constant";

/** The demo's keys. */
const K = ICON_BUTTON_DEMO_KEYS.demo_free.icon_button.live;

/** How long the load holds its press, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

/** Count presses; Load stays busy for a moment. */
export default function Live() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const t = useCatalogueText(MESSAGES.en);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <IconButton icon="plus" label={t(K.count)} onPress={() => setCount((value) => value + 1)} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t(K.presses, { count })}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <IconButton
          icon="download"
          label={t(K.load)}
          variant="secondary"
          isLoading={isLoading}
          onPress={() => setIsLoading(true)}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t(isLoading ? K.loading : K.idle)}
        </Text>
      </View>
    </View>
  );
}
