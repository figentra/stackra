/**
 * Stackra file contract:
 * Purpose: the "motion" demo of the native Modal: `motion` sets how the dialog enters: rising from the bottom, dropping
 *          flush under the top, or sliding in from the inline end as a full-height panel.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import { Button, Modal, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_DEMO_KEYS } from "#src/demos/free/modal/modal-demo-keys.constant";

/** The demo's keys. */
const K = MODAL_DEMO_KEYS.demo_free.modal.motion;

/** The motions, each with the catalogue key of the button that opens it. */
const MOTIONS = [
  ["slide-up", "slide_up"],
  ["stick-top", "stick_top"],
  ["slide-side", "slide_side"],
] as const;

/** The same dialog, entering three ways. */
export default function Motion() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-2">
      {MOTIONS.map(([motion, key]) => (
        <Modal
          key={motion}
          motion={motion}
          trigger={
            <Button variant="secondary" size="sm">
              {t(K[key])}
            </Button>
          }
        >
          <Modal.Header>
            <Modal.Title>{t(K.heading)}</Modal.Title>
            <Modal.Close label={t(K.close)} />
          </Modal.Header>
          <Modal.Body>{t(K.body)}</Modal.Body>
        </Modal>
      ))}
    </View>
  );
}
