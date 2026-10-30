/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native AlertDialog: a plain question with two buttons and a title.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AlertDialog, Button, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DIALOG_DEMO_KEYS } from "#src/demos/free/alert-dialog/alert-dialog-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DIALOG_DEMO_KEYS.demo_free.alert_dialog.basics;

/** Two buttons and a title; nothing outside the dialog answers it. */
export default function Basics() {
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

        title={t(K.question)}
        description={t(K.body)}
        confirmLabel={t(K.confirm)}
        cancelLabel={t(K.cancel)}
      />
    </>
  );
}
