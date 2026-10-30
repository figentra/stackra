/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the native Modal: the page holds `isOpen`, so its own buttons open and close it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Modal, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_DEMO_KEYS } from "#src/demos/free/modal/modal-demo-keys.constant";

/** The demo's keys. */
const K = MODAL_DEMO_KEYS.demo_free.modal.controlled;

/** Open from outside; the footer buttons close it and record the choice. */
export default function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  const [last, setLast] = useState<"cancel" | "send" | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const choose = (choice: "cancel" | "send") => {
    setLast(choice);
    setIsOpen(false);
  };
  return (
    <View className="items-start gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(isOpen ? K.is_open : K.is_closed)}
      </Text>
      <Text tone="muted">{last === null ? t(K.none) : t(K.last, { action: t(K[last]) })}</Text>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Header>
          <Modal.Title>{t(K.heading)}</Modal.Title>
          <Modal.Close label={t(K.close)} />
        </Modal.Header>
        <Modal.Body>{t(K.body)}</Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onPress={() => choose("cancel")}>
            {t(K.cancel)}
          </Button>
          <Button onPress={() => choose("send")}>{t(K.send)}</Button>
        </Modal.Footer>
      </Modal>
    </View>
  );
}
