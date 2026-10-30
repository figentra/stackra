/**
 * Stackra file contract:
 * Purpose: the "motion" demo of the web Modal: the same dialog entering three ways: rising from the bottom edge,
 *          dropping flush under the top edge, or sliding in from the inline end as a full-height panel.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0329 (motion layer); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, Modal, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_KEYS } from "#src/demos/free/modal/modal-keys.constant";

/** The demo's keys. */
const K = MODAL_KEYS.modal;

/** Modal: Motion. */
export default function Motion() {
  const t = useCatalogueText(MESSAGES.en);
  /** The motions, each with the label of the button that opens it. */
  const MOTIONS = [
    { motion: "slide-up", label: t(K.open_slide_up) },
    { motion: "stick-top", label: t(K.open_stick_top) },
    { motion: "slide-side", label: t(K.open_slide_side) },
  ] as const;
  return (
    <ul className="flex flex-wrap items-center gap-4">
      {MOTIONS.map(({ motion, label }) => (
        <li key={motion}>
          <Modal motion={motion} trigger={<Button variant="secondary">{label}</Button>}>
            <Modal.Close label={t(K.close)} />
            <Modal.Header>
              <Modal.Title>{t(K.motion_title)}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Text>{t(K.motion_body)}</Text>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close">
                {t(K.cancel)}
              </Button>
            </Modal.Footer>
          </Modal>
        </li>
      ))}
    </ul>
  );
}
