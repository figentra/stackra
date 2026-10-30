/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native ErrorState: the first two retries fail again; the third succeeds.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, ErrorState, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_DEMO_KEYS } from "#src/demos/free/error-state/error-state-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_DEMO_KEYS.demo_free.error_state.live;

/** How many attempts fail before the build succeeds. */
const FAILURES = 2;

/** Retry until it works; Fail it again starts over. */
export default function Live() {
  const [attempts, setAttempts] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      {attempts > FAILURES ? (
        <>
          <Text accessibilityLiveRegion="polite">{t(K.done)}</Text>
          <Button size="sm" variant="secondary" onPress={() => setAttempts(0)}>
            {t(K.reset)}
          </Button>
        </>
      ) : (
        <ErrorState
          headingLevel={3}
          title={t(K.heading)}
          retry={{ label: t(K.retry), onPress: () => setAttempts((count) => count + 1) }}
        />
      )}
      <Text tone="muted">{t(K.attempts, { count: attempts })}</Text>
    </View>
  );
}
