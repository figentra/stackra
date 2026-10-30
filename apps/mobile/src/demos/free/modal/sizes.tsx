/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Modal: `size` caps the width; `full` fills the screen.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Size } from "@stackra/ui/contracts";
import { Button, Modal, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_DEMO_KEYS } from "#src/demos/free/modal/modal-demo-keys.constant";

/** The demo's keys. */
const K = MODAL_DEMO_KEYS.demo_free.modal.sizes;

/** The values the buttons open. */
const SIZES = [...Size, "full"] as const;

/** Small, medium and large caps, then the full screen. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-2">
      {SIZES.map((size) => (
        <Modal
          key={size}
          size={size}
          trigger={
            <Button variant="secondary" size="sm">
              {t(K.open, { size })}
            </Button>
          }
        >
          <Modal.Header>
            <Modal.Title>{t(K.heading, { size })}</Modal.Title>
            <Modal.Close label={t(K.close, { size })} />
          </Modal.Header>
          <Modal.Body>{t(K.body)}</Modal.Body>
        </Modal>
      ))}
    </View>
  );
}
