/**
 * Stackra file contract:
 * Purpose: the "position" demo of the web Modal: Auto lets the runtime choose; the others pin the dialog to the top,
 *          middle or bottom.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import type { ModalProps } from "@stackra/ui/react";
import { Button, Modal as UiModal, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODAL_KEYS } from "#src/demos/free/modal/modal-keys.constant";

/** The demo's keys. */
const K = MODAL_KEYS.modal;

/** The list that lays triggers out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Props of {@link Sample}. */
interface SampleProps extends Pick<
  ModalProps,
  "size" | "position" | "isDismissable" | "isKeyboardDismissDisabled"
> {
  /** The label of the button that opens the modal. */
  readonly buttonLabel: string;
  /** The modal's title. */
  readonly title: string;
  /** The sentence in the modal's body. */
  readonly body: string;
}

/** One modal with its own trigger button, a close button, a title, a body sentence and a Cancel button. */
function Sample({ buttonLabel, title, body, ...modalProps }: SampleProps) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiModal trigger={<Button variant="secondary">{buttonLabel}</Button>} {...modalProps}>
      <UiModal.Close label={t(K.close)} />
      <UiModal.Header>
        <UiModal.Title>{title}</UiModal.Title>
      </UiModal.Header>
      <UiModal.Body>
        <Text>
          <bdi>{body}</bdi>
        </Text>
      </UiModal.Body>
      <UiModal.Footer>
        <Button variant="secondary" slot="close">
          {t(K.cancel)}
        </Button>
      </UiModal.Footer>
    </UiModal>
  );
}

/** The Modal demo: position. */
export default function Position() {
  const t = useCatalogueText(MESSAGES.en);
  /** The vertical positions the modal takes, each with the label of the button that opens it. */
  const POSITIONS = [
    { position: "auto", label: t(K.open_auto) },
    { position: "top", label: t(K.open_top) },
    { position: "center", label: t(K.open_center) },
    { position: "bottom", label: t(K.open_bottom) },
  ] as const;
  return (
    <ul className={ROW}>
      {POSITIONS.map(({ position, label }) => (
        <li key={position}>
          <Sample
            buttonLabel={label}
            title={t(K.position_title)}
            body={t(K.body)}
            position={position}
          />
        </li>
      ))}
    </ul>
  );
}
