/**
 * Stackra file contract:
 * Purpose: the "retry" demo of the native ErrorState: `retry` draws the button that tries again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ErrorState, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_DEMO_KEYS } from "#src/demos/free/error-state/error-state-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_DEMO_KEYS.demo_free.error_state.retry;

/** The readout counts the presses. */
export default function Retry() {
  const [retries, setRetries] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <ErrorState
        headingLevel={3}
        title={t(K.heading)}
        retry={{ label: t(K.label), onPress: () => setRetries((count) => count + 1) }}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.count, { count: retries })}
      </Text>
    </View>
  );
}
