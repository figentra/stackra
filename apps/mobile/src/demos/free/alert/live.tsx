/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Alert: dismiss it to hide it; Show again brings it back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Alert, Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DEMO_KEYS } from "#src/demos/free/alert/alert-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DEMO_KEYS.demo_free.alert.live;

/** A dismissable alert and a way back. */
export default function Live() {
  const [isShown, setIsShown] = useState(true);
  const t = useCatalogueText(MESSAGES.en);
  return isShown ? (
    <Alert
      tone="accent"
      title={t(K.alert_title)}
      description={t(K.alert_description)}
      actions={
        <Button size="sm" variant="secondary" onPress={() => setIsShown(false)}>
          {t(K.dismiss)}
        </Button>
      }
    />
  ) : (
    <View className="items-start gap-3">
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.hidden)}
      </Text>
      <Button size="sm" variant="secondary" onPress={() => setIsShown(true)}>
        {t(K.show_again)}
      </Button>
    </View>
  );
}
