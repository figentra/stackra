/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the native AlertDialog: `icon` by name instead of the tone's, and `false` for none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AlertDialog, Button, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DIALOG_DEMO_KEYS } from "#src/demos/free/alert-dialog/alert-dialog-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DIALOG_DEMO_KEYS.demo_free.alert_dialog.icons;

/** A bell instead of the tone's icon, and a dialog with no icon. */
export default function Icons() {
  const [open, setOpen] = useState<"bell" | "none" | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) setOpen(null);
  };
  return (
    <View className="flex-row flex-wrap gap-3">
      <Button variant="secondary" onPress={() => setOpen("bell")}>
        {t(K.custom)}
      </Button>
      <Button variant="secondary" onPress={() => setOpen("none")}>
        {t(K.none)}
      </Button>
      <AlertDialog
        isOpen={open === "bell"}
        onOpenChange={onOpenChange}
        tone="accent"
        icon="bell"
        title={t(K.custom_question)}
        confirmLabel={t(K.confirm)}
        cancelLabel={t(K.cancel)}
      />
      <AlertDialog
        isOpen={open === "none"}
        onOpenChange={onOpenChange}
        icon={false}
        title={t(K.none_question)}
        confirmLabel={t(K.confirm)}
        cancelLabel={t(K.cancel)}
      />
    </View>
  );
}
