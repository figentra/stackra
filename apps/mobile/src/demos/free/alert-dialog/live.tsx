/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native AlertDialog: `onConfirm` and `onCancel`, and a readout of the answer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AlertDialog, Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DIALOG_DEMO_KEYS } from "#src/demos/free/alert-dialog/alert-dialog-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DIALOG_DEMO_KEYS.demo_free.alert_dialog.live;

/** Answer the dialog; the readout says how. */
export default function Live() {
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState<"confirmed" | "refused" | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={t(K.question)}
        confirmLabel={t(K.confirm)}
        cancelLabel={t(K.cancel)}
        onConfirm={() => setAnswer("confirmed")}
        onCancel={() => setAnswer("refused")}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(answer === null ? K.none : K[answer])}
      </Text>
    </View>
  );
}
