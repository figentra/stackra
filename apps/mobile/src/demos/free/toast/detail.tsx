/**
 * Stackra file contract:
 * Purpose: the "detail" demo of the native `toast()`: `description` adds a second line, `icon` swaps the tone's icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           `toast()` fills the one `ToastProvider` the app root mounts (`components/ui/showcase-toasts.tsx`).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, toast, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

/** The demo's keys. */
const K = TOAST_DEMO_KEYS.demo_free.toast.detail;

/** A second line, and another icon by name. */
export default function Detail() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => toast.success(t(K.message), { description: t(K.detail) })}
      >
        {t(K.with_detail)}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => toast.info(t(K.reminder), { icon: Icons.Bell })}
      >
        {t(K.with_icon)}
      </Button>
    </View>
  );
}
