/**
 * Stackra file contract:
 * Purpose: the "locked" demo of the native Modal: `isDismissable` off and `isKeyboardDismissDisabled` on.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Modal, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_DEMO_KEYS } from "#src/demos/free/modal/modal-demo-keys.constant";

/** The demo's keys. */
const K = MODAL_DEMO_KEYS.demo_free.modal.locked;

/** A press outside, a swipe and the Android back button do nothing; only Accept closes it. */
export default function Locked() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        isDismissable={false}
        isKeyboardDismissDisabled
      >
        <Modal.Header>
          <Modal.Title>{t(K.heading)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t(K.body)}</Modal.Body>
        <Modal.Footer>
          <Button onPress={() => setIsOpen(false)}>{t(K.accept)}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
