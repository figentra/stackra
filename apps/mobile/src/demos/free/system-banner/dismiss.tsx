/**
 * Stackra file contract:
 * Purpose: the "dismiss" demo of the native SystemBanner: dismissing slides the banner away, then the screen notes it;
 *          the button below brings it back, as an app would after its next notice.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 27.
 */
import { Button, SystemBanner, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SYSTEM_BANNER_DEMO_KEYS } from "#src/demos/free/system-banner/system-banner-demo-keys.constant";

/** The demo's keys. */
const K = SYSTEM_BANNER_DEMO_KEYS.demo_free.system_banner;

/** Dismiss the banner, then bring it back. */
export default function Dismiss() {
  const t = useCatalogueText(MESSAGES.en);
  const [isDismissed, setDismissed] = useState(false);
  return (
    <View className="gap-3">
      {isDismissed ? (
        <>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {t(K.dismissed)}
          </Text>
          <Button size="sm" variant="secondary" onPress={() => setDismissed(false)}>
            {t(K.show_again)}
          </Button>
        </>
      ) : (
        <SystemBanner
          tone="danger"
          title={t(K.outage_title)}
          description={t(K.outage_detail)}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </View>
  );
}
