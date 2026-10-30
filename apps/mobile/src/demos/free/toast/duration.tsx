/**
 * Stackra file contract:
 * Purpose: the "duration" demo of the native `toast()`: `timeout` in milliseconds, 0 to stay, and `toast.clear()`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           `toast()` fills the one `ToastProvider` the app root mounts (`components/ui/showcase-toasts.tsx`).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, toast, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

/** The demo's keys. */
const K = TOAST_DEMO_KEYS.demo_free.toast.duration;

/** One second, until dismissed, and clear every toast. */
export default function Duration() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => toast(t(K.short_message), { timeout: 1000 })}
      >
        {t(K.short)}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => toast(t(K.persistent_message), { timeout: 0 })}
      >
        {t(K.persistent)}
      </Button>
      <Button size="sm" variant="tertiary" onPress={() => toast.clear()}>
        {t(K.clear)}
      </Button>
    </View>
  );
}
