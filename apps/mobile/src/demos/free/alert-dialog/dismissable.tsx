/**
 * Stackra file contract:
 * Purpose: the "dismissable" demo of the native AlertDialog: `isDismissable`, a press outside counts as a refusal.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AlertDialog, Button, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DIALOG_DEMO_KEYS } from "#src/demos/free/alert-dialog/alert-dialog-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DIALOG_DEMO_KEYS.demo_free.alert_dialog.dismissable;

/** A press outside the dialog refuses. */
export default function Dismissable() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        tone="warning"
        isDismissable
        title={t(K.question)}
        description={t(K.body)}
        confirmLabel={t(K.confirm)}
        cancelLabel={t(K.cancel)}
      />
    </>
  );
}
