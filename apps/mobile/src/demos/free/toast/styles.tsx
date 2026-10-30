/**
 * Stackra file contract:
 * Purpose: the "styles" demo of the native toast: pick the look (alert, bar, flip bar, bubble) and the place along the
 *          edge (start, centre, end, full width), then show toasts to see them stack; swipe one away.
 * Boundary: the look and place are `ToastProvider` props, and the app mounts one provider for every screen
 *           (`components/ui/showcase-toasts.tsx`), so this demo sets them through the app's
 *           `ShowcaseToastStyleContext`; in an app, pass `variant` and `align` to your own `ToastProvider`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import type { ToastAlign, ToastVariant } from "@stackra/ui/contracts";
import { Button, RadioGroup, toast, useCatalogueText } from "@stackra/ui/native";
import { use } from "react";
import { View } from "react-native";

import { ShowcaseToastStyleContext } from "#src/components/ui/showcase-toast-style-context";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

/** The demo's keys. */
const K = TOAST_DEMO_KEYS.demo_free.toast.styles;

/** The looks, each with its catalogue key. */
const LOOKS = [
  ["alert", "alert"],
  ["bar", "bar"],
  ["flip-bar", "flip_bar"],
  ["bubble", "bubble"],
] as const;

/** The places along the edge. */
const ALIGNS = ["start", "center", "end", "full"] as const;

/** Pick a look and a place, then show two toasts. */
export default function Styles() {
  const t = useCatalogueText(MESSAGES.en);
  const style = use(ShowcaseToastStyleContext);
  return (
    <View className="gap-4">
      <RadioGroup
        label={t(K.look)}
        value={style?.variant ?? "alert"}
        onChange={(next) => style?.setVariant(next as ToastVariant)}
        options={LOOKS.map(([value, key]) => ({ value, label: t(K[key]) }))}
      />
      <RadioGroup
        label={t(K.align)}
        value={style?.align ?? "full"}
        onChange={(next) => style?.setAlign(next as ToastAlign)}
        options={ALIGNS.map((value) => ({ value, label: t(K[value]) }))}
      />
      <View className="items-start">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            toast.success(t(K.saved));
            toast(t(K.mention), { avatar: { name: t(K.person) } });
          }}
        >
          {t(K.show)}
        </Button>
      </View>
    </View>
  );
}
