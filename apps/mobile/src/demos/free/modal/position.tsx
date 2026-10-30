/**
 * Stackra file contract:
 * Purpose: the "position" demo of the native Modal: `position` sets where the dialog sits: top, centre or bottom.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Modal, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_DEMO_KEYS } from "#src/demos/free/modal/modal-demo-keys.constant";

/** The demo's keys. */
const K = MODAL_DEMO_KEYS.demo_free.modal.position;

/** The values the buttons open. */
const POSITIONS = ["top", "center", "bottom"] as const;

/** The dialog keeps its width and moves along the screen. */
export default function Position() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-2">
      {POSITIONS.map((position) => (
        <Modal
          key={position}
          position={position}
          trigger={
            <Button variant="secondary" size="sm">
              {t(K.open, { position })}
            </Button>
          }
        >
          <Modal.Header>
            <Modal.Title>{t(K.heading, { position })}</Modal.Title>
            <Modal.Close label={t(K.close, { position })} />
          </Modal.Header>
          <Modal.Body>{t(K.body)}</Modal.Body>
        </Modal>
      ))}
    </View>
  );
}
