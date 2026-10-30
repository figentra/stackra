/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native `toast()`: a plain toast and one of each tone (success, warning, danger, info).
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
const K = TOAST_DEMO_KEYS.demo_free.toast.tones;

/** `toast()` is plain; its tone methods set the icon and how it is announced. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button size="sm" variant="secondary" onPress={() => toast(t(K.plain_message))}>
        {t(K.plain)}
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.success(t(K.success_message))}>
        {t(K.success)}
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.warning(t(K.warning_message))}>
        {t(K.warning)}
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.danger(t(K.danger_message))}>
        {t(K.danger)}
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.info(t(K.info_message))}>
        {t(K.info)}
      </Button>
    </View>
  );
}
