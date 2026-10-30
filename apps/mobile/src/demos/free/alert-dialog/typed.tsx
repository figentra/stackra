/**
 * Stackra file contract:
 * Purpose: the "typed" demo of the native AlertDialog: `isConfirmDisabled` until the project's name is typed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AlertDialog, Button, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DIALOG_DEMO_KEYS } from "#src/demos/free/alert-dialog/alert-dialog-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DIALOG_DEMO_KEYS.demo_free.alert_dialog.typed;

/** The confirming press waits for "Atlas" to be typed. */
export default function Typed() {
  const [isOpen, setIsOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        tone="danger"
        title={t(K.question)}
        description={t(K.body)}
        confirmLabel={t(K.confirm)}
        cancelLabel={t(K.cancel)}
        isConfirmDisabled={typed.trim() !== "Atlas"}
      >
        <TextField label={t(K.field)} value={typed} onChange={setTyped} autoCapitalize="none" />
      </AlertDialog>
    </>
  );
}
