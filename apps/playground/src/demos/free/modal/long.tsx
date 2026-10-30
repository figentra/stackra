/**
 * Stackra file contract:
 * Purpose: the "long" demo of the web Modal: A long body scrolls inside the dialog; the header and footer stay in
 *          place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Modal as UiModal, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_KEYS } from "#src/demos/free/modal/modal-keys.constant";

/** The demo's keys. */
const K = MODAL_KEYS.modal;

/** Modal: Long content. */
export default function Long() {
  const t = useCatalogueText(MESSAGES.en);
  /** Thirty paragraphs, enough to overflow the tallest dialog in a normal window. */
  const PARAGRAPHS = Array.from({ length: 30 }, (_, index) => `${index + 1}. ${t(K.long_body)}`);
  return (
    <div>
      <UiModal trigger={<Button variant="secondary">{t(K.open_long)}</Button>}>
        <UiModal.Close label={t(K.close)} />
        <UiModal.Header>
          <UiModal.Title>{t(K.long_title)}</UiModal.Title>
        </UiModal.Header>
        <UiModal.Body tabIndex={0}>
          {PARAGRAPHS.map((paragraph) => (
            <Text key={paragraph}>
              <bdi>{paragraph}</bdi>
            </Text>
          ))}
        </UiModal.Body>
        <UiModal.Footer>
          <Button slot="close">{t(K.done)}</Button>
        </UiModal.Footer>
      </UiModal>
    </div>
  );
}
