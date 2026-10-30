/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Button: a save that loads for a moment and a press counter.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { BUTTON_KEYS } from "#src/constants/button-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

/** How long the save stays loading, in milliseconds. */
const SAVE_MILLISECONDS = 1500;

/** The demo's keys. */
const K = BUTTON_KEYS.button.live;

/** Press Save: it loads for a moment. The counter counts presses; the disabled one does not. */
export default function Live() {
  const [isSaving, setIsSaving] = useState(false);
  const [count, setCount] = useState(0);
  const t = useCatalogueText(MESSAGES.en);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isSaving) return undefined;
    const timer = setTimeout(() => setIsSaving(false), SAVE_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isSaving]);

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center gap-3">
        <Button isLoading={isSaving} onPress={() => setIsSaving(true)}>
          {t(K.save)}
        </Button>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t(isSaving ? K.saving : K.idle)}
        </Text>
      </View>
      <View className="flex-row flex-wrap items-center gap-3">
        <Button onPress={() => setCount((value) => value + 1)}>{t(K.count)}</Button>
        <Button isDisabled onPress={() => setCount((value) => value + 1)}>
          {t(K.count_disabled)}
        </Button>
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.presses, { count })}
      </Text>
    </View>
  );
}
