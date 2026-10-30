/**
 * Stackra file contract:
 * Purpose: the "promise" demo of the native `toast()`: two buttons start a two-second save, one that succeeds and one
 *          that fails; one toast follows each from a spinner to the result, in place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           `toast()` fills the one `ToastProvider` the app root mounts (`components/ui/showcase-toasts.tsx`).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0312; STA-1371.
 */
import { Button, toast, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

/** The demo's keys. */
const K = TOAST_DEMO_KEYS.demo_free.toast.promise;

/** A save that settles after two seconds. */
const save = (isOk: boolean) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (isOk) resolve();
      else reject(new Error("offline"));
    }, 2000);
  });

/** Toast: following a promise. */
export default function FollowsPromise() {
  const t = useCatalogueText(MESSAGES.en);
  const run = (isOk: boolean) =>
    toast.promise(() => save(isOk), {
      loading: t(K.loading),
      success: t(K.success),
      error: t(K.error),
    });
  return (
    <View className="flex-row flex-wrap gap-3">
      <Button size="sm" variant="secondary" onPress={() => run(true)}>
        {t(K.save)}
      </Button>
      <Button size="sm" variant="secondary" onPress={() => run(false)}>
        {t(K.fail)}
      </Button>
    </View>
  );
}
