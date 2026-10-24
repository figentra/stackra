/**
 * Stackra file contract:
 * Purpose: the page of the modal route: a modal at every size and every vertical position, the three dismissal
 *          settings (the default, outside press off, Escape off), a long body that scrolls inside the dialog, and a
 *          live example whose controlled modal edits a name and reports it, all from `@stackra/ui/react` with real
 *          props. Every sample opens from its own trigger button.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. A footer button with
 *           `slot="close"` closes its modal without state; the live example drives its modal with `isOpen`. The long
 *           body takes `tabIndex={0}` so a keyboard user can scroll it (WCAG 2.2 SC 2.1.1).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL);
 *          WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ModalRoute } from "#src/routes/modal/modal.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::modal.*` keys.
const STRINGS = {
  documentTitle: `${ModalRoute.title} · Stackra Playground`,
  intro:
    "A modal is a centred dialog that blocks the page until it closes. Focus moves into it and stays there, the page behind it is hidden from screen readers, and focus returns to the button that opened it. Its title names it.",
  sizes: "Sizes",
  sizesNote: "Small, medium and large cap the width; full fills the screen.",
  position: "Position",
  positionNote:
    "Auto lets the runtime choose; the others pin the dialog to the top, middle or bottom.",
  dismissal: "Dismissal",
  dismissalNote:
    "By default a press outside the dialog and the Escape key close it. A step the user must finish turns them off and keeps its own close button.",
  live: "Try it",
  liveNote: "A controlled modal: Save closes it and keeps the name, Cancel keeps the old one.",
  long: "Long content",
  longNote: "A long body scrolls inside the dialog; the header and footer stay in place.",
  close: "Close",
  done: "Done",
  cancel: "Cancel",
  save: "Save",
  body: "This is the body of the modal. It holds any content: text, a form or a list.",
  sizeTitle: "Modal size",
  positionTitle: "Modal position",
  dismissalTitle: "Modal dismissal",
  openSmall: "Open small",
  openMedium: "Open medium",
  openLarge: "Open large",
  openFull: "Open full",
  openAuto: "Open auto",
  openTop: "Open top",
  openCenter: "Open centre",
  openBottom: "Open bottom",
  openDefault: "Open default",
  openOutsideOff: "Open with outside press off",
  openEscapeOff: "Open with Escape off",
  outsideOffBody: "A press outside the dialog does not close it. Use Close or Cancel.",
  escapeOffBody: "The Escape key does not close it. A press outside, Close and Cancel still do.",
  editName: "Edit name",
  editTitle: "Edit your name",
  fullName: "Full name",
  currentName: "Current name:",
  openLong: "Open long content",
  longTitle: "Terms of use",
  longBody:
    "A paragraph of the terms. The body keeps scrolling while the title above and the buttons below stay where they are, so the user can always reach them.",
} as const;

/** The list that lays triggers out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The sizes the modal takes, each with the label of the button that opens it. */
const SIZES = [
  { size: "sm", label: STRINGS.openSmall },
  { size: "md", label: STRINGS.openMedium },
  { size: "lg", label: STRINGS.openLarge },
  { size: "full", label: STRINGS.openFull },
] as const;

/** The vertical positions the modal takes, each with the label of the button that opens it. */
const POSITIONS = [
  { position: "auto", label: STRINGS.openAuto },
  { position: "top", label: STRINGS.openTop },
  { position: "center", label: STRINGS.openCenter },
  { position: "bottom", label: STRINGS.openBottom },
] as const;

/** Thirty paragraphs, enough to overflow the tallest dialog in a normal window. */
const PARAGRAPHS = Array.from({ length: 30 }, (_, index) => `${index + 1}. ${STRINGS.longBody}`);

/** Props of {@link Sample}. */
interface SampleProps extends Pick<
  Ui.ModalProps,
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
  return (
    <Ui.Modal trigger={<Ui.Button variant="secondary">{buttonLabel}</Ui.Button>} {...modalProps}>
      <Ui.Modal.Close label={STRINGS.close} />
      <Ui.Modal.Header>
        <Ui.Modal.Title>{title}</Ui.Modal.Title>
      </Ui.Modal.Header>
      <Ui.Modal.Body>
        <Ui.Text>
          <bdi>{body}</bdi>
        </Ui.Text>
      </Ui.Modal.Body>
      <Ui.Modal.Footer>
        <Ui.Button variant="secondary" slot="close">
          {STRINGS.cancel}
        </Ui.Button>
      </Ui.Modal.Footer>
    </Ui.Modal>
  );
}

/** The Modal page. */
export function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("Ada Lovelace");
  const [draft, setDraft] = useState(name);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{ModalRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="modal-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <ul className={ROW}>
          {SIZES.map(({ size, label }) => (
            <li key={size}>
              <Sample
                buttonLabel={label}
                title={STRINGS.sizeTitle}
                body={STRINGS.body}
                size={size}
              />
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="modal-position" title={STRINGS.position} note={STRINGS.positionNote}>
        <ul className={ROW}>
          {POSITIONS.map(({ position, label }) => (
            <li key={position}>
              <Sample
                buttonLabel={label}
                title={STRINGS.positionTitle}
                body={STRINGS.body}
                position={position}
              />
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="modal-dismissal" title={STRINGS.dismissal} note={STRINGS.dismissalNote}>
        <ul className={ROW}>
          <li>
            <Sample
              buttonLabel={STRINGS.openDefault}
              title={STRINGS.dismissalTitle}
              body={STRINGS.body}
            />
          </li>
          <li>
            <Sample
              buttonLabel={STRINGS.openOutsideOff}
              title={STRINGS.dismissalTitle}
              body={STRINGS.outsideOffBody}
              isDismissable={false}
            />
          </li>
          <li>
            <Sample
              buttonLabel={STRINGS.openEscapeOff}
              title={STRINGS.dismissalTitle}
              body={STRINGS.escapeOffBody}
              isKeyboardDismissDisabled
            />
          </li>
        </ul>
      </PageSection>

      <PageSection id="modal-long" title={STRINGS.long} note={STRINGS.longNote}>
        <div>
          <Ui.Modal trigger={<Ui.Button variant="secondary">{STRINGS.openLong}</Ui.Button>}>
            <Ui.Modal.Close label={STRINGS.close} />
            <Ui.Modal.Header>
              <Ui.Modal.Title>{STRINGS.longTitle}</Ui.Modal.Title>
            </Ui.Modal.Header>
            <Ui.Modal.Body tabIndex={0}>
              {PARAGRAPHS.map((paragraph) => (
                <Ui.Text key={paragraph}>
                  <bdi>{paragraph}</bdi>
                </Ui.Text>
              ))}
            </Ui.Modal.Body>
            <Ui.Modal.Footer>
              <Ui.Button slot="close">{STRINGS.done}</Ui.Button>
            </Ui.Modal.Footer>
          </Ui.Modal>
        </div>
      </PageSection>

      <PageSection id="modal-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid max-w-sm gap-3">
          <div>
            <Ui.Button
              onPress={() => {
                setDraft(name);
                setIsOpen(true);
              }}
            >
              {STRINGS.editName}
            </Ui.Button>
          </div>
          <Ui.Text role="status">
            <bdi>{`${STRINGS.currentName} ${name}`}</bdi>
          </Ui.Text>
          <Ui.Modal isOpen={isOpen} onOpenChange={setIsOpen}>
            <Ui.Modal.Close label={STRINGS.close} />
            <Ui.Modal.Header>
              <Ui.Modal.Title>{STRINGS.editTitle}</Ui.Modal.Title>
            </Ui.Modal.Header>
            <Ui.Modal.Body>
              <Ui.TextField label={STRINGS.fullName} value={draft} onChange={setDraft} />
            </Ui.Modal.Body>
            <Ui.Modal.Footer>
              <Ui.Button variant="secondary" slot="close">
                {STRINGS.cancel}
              </Ui.Button>
              <Ui.Button
                onPress={() => {
                  setName(draft);
                  setIsOpen(false);
                }}
              >
                {STRINGS.save}
              </Ui.Button>
            </Ui.Modal.Footer>
          </Ui.Modal>
        </div>
      </PageSection>
    </article>
  );
}
