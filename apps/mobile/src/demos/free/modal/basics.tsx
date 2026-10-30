/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Modal: a trigger opens it; its close button or a press outside closes it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Modal, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_DEMO_KEYS } from "#src/demos/free/modal/modal-demo-keys.constant";

/** The demo's keys. */
const K = MODAL_DEMO_KEYS.demo_free.modal.basics;

/** The title names the dialog. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Modal trigger={<Button variant="secondary">{t(K.open)}</Button>}>
      <Modal.Header>
        <Modal.Title>{t(K.heading)}</Modal.Title>
        <Modal.Close label={t(K.close)} />
      </Modal.Header>
      <Modal.Body>{t(K.body)}</Modal.Body>
    </Modal>
  );
}
