/**
 * Stackra file contract:
 * Purpose: the "undo" demo of the native `toast()`: deleting shows a toast with "Undo" and the seconds left; the line
 *          below says whether the order was restored or deleted for good once the toast closed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           `toast()` fills the one `ToastProvider` the app root mounts (`components/ui/showcase-toasts.tsx`).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0312; WCAG 2.2 SC 2.2.1;
 *          STA-1371.
 */
import { Button, Text, toast, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

/** The demo's keys. */
const K = TOAST_DEMO_KEYS.demo_free.toast.undo;

/** Toast: undo with a countdown. */
export default function Undo() {
  const t = useCatalogueText(MESSAGES.en);
  const [outcome, setOutcome] = useState<"waiting" | "undone" | "committed">("waiting");
  return (
    <View className="items-start gap-3">
      <Button
        size="sm"
        variant="secondary"
        onPress={() =>
          toast.undo(t(K.deleted), {
            onUndo: () => setOutcome("undone"),
            onCommit: () => setOutcome("committed"),
          })
        }
      >
        {t(K.delete)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K[outcome])}
      </Text>
    </View>
  );
}
