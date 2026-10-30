/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Modal: Small, medium and large cap the width; full fills the screen.
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

/** The Modal demo: sizes. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  /** The sizes the modal takes, each with the label of the button that opens it. */
  const SIZES = [
    { size: "sm", label: t(K.open_small) },
    { size: "md", label: t(K.open_medium) },
    { size: "lg", label: t(K.open_large) },
    { size: "full", label: t(K.open_full) },
  ] as const;
  return (
    <ul className={ROW}>
      {SIZES.map(({ size, label }) => (
        <li key={size}>
          <Sample buttonLabel={label} title={t(K.size_title)} body={t(K.body)} size={size} />
        </li>
      ))}
    </ul>
  );
}
