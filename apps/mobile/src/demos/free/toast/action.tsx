/**
 * Stackra file contract:
 * Purpose: the "action" demo of the native `toast()`: one action button that runs its handler and closes the toast.
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
const K = TOAST_DEMO_KEYS.demo_free.toast.action;

/** Delete, then Undo from the toast; the readout says whether it was undone. */
export default function Action() {
  const [isUndone, setIsUndone] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setIsUndone(false);
          toast(t(K.message), { action: { label: t(K.undo), onPress: () => setIsUndone(true) } });
        }}
      >
        {t(K.show)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(isUndone ? K.undone : K.waiting)}
      </Text>
    </View>
  );
}
