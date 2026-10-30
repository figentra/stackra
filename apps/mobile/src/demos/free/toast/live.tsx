/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native `toast()`: `onClose` counts the toasts that closed, however they closed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           `toast()` fills the one `ToastProvider` the app root mounts (`components/ui/showcase-toasts.tsx`).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Text, toast, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

/** The demo's keys. */
const K = TOAST_DEMO_KEYS.demo_free.toast.live;

/** Show a toast; the readout counts the closes. */
export default function Live() {
  const [closed, setClosed] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Button
        size="sm"
        variant="secondary"
        onPress={() =>
          toast.success(t(K.message), { onClose: () => setClosed((count) => count + 1) })
        }
      >
        {t(K.show)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {closed === 0 ? t(K.none) : t(K.closed, { count: closed })}
      </Text>
    </View>
  );
}
