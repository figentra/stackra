/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Modal: A controlled modal: Save closes it and keeps the name, Cancel keeps the
 *          old one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import { Button, Modal as UiModal, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_KEYS } from "#src/demos/free/modal/modal-keys.constant";

/** The demo's keys. */
const K = MODAL_KEYS.modal;

/** Modal: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState("Ada Lovelace");

  const [draft, setDraft] = useState(name);

  return (
    <div className="grid max-w-sm gap-3">
      <div>
        <Button
          onPress={() => {
            setDraft(name);
            setIsOpen(true);
          }}
        >
          {t(K.edit_name)}
        </Button>
      </div>
      <Text role="status">
        <bdi>{`${t(K.current_name)} ${name}`}</bdi>
      </Text>
      <UiModal isOpen={isOpen} onOpenChange={setIsOpen}>
        <UiModal.Close label={t(K.close)} />
        <UiModal.Header>
          <UiModal.Title>{t(K.edit_title)}</UiModal.Title>
        </UiModal.Header>
        <UiModal.Body>
          <TextField label={t(K.full_name)} value={draft} onChange={setDraft} />
        </UiModal.Body>
        <UiModal.Footer>
          <Button variant="secondary" slot="close">
            {t(K.cancel)}
          </Button>
          <Button
            onPress={() => {
              setName(draft);
              setIsOpen(false);
            }}
          >
            {t(K.save)}
          </Button>
        </UiModal.Footer>
      </UiModal>
    </div>
  );
}
