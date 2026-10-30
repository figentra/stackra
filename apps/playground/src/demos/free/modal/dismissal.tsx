/**
 * Stackra file contract:
 * Purpose: the "dismissal" demo of the web Modal: By default a press outside the dialog and the Escape key close it.
 *          A step the user must finish turns them off and keeps its own close button.
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

/** The Modal demo: dismissal. */
export default function Dismissal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <Sample buttonLabel={t(K.open_default)} title={t(K.dismissal_title)} body={t(K.body)} />
      </li>
      <li>
        <Sample
          buttonLabel={t(K.open_outside_off)}
          title={t(K.dismissal_title)}
          body={t(K.outside_off_body)}
          isDismissable={false}
        />
      </li>
      <li>
        <Sample
          buttonLabel={t(K.open_escape_off)}
          title={t(K.dismissal_title)}
          body={t(K.escape_off_body)}
          isKeyboardDismissDisabled
        />
      </li>
    </ul>
  );
}
