/**
 * Stackra file contract:
 * Purpose: the page of the popover route: the four sides, the three alignments, the content forms (titled, with an
 *          arrow, named by `aria-label`, with a field and an action), the dismissal rules (the default, a step that a
 *          press outside cannot close and one that Escape cannot close) and a live example driven from outside whose
 *          open state is reported, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The samples sit in centred rows so
 *           a popover has room on every side and is never flipped or shifted by the viewport edge.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL);
 *          WCAG 2.2 SC 2.1.2 and 2.5.8.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { PopoverRoute } from "#src/routes/popover/popover.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::popover.*` keys.
const STRINGS = {
  documentTitle: `${PopoverRoute.title} · Stackra Playground`,
  intro:
    "A popover holds content that is too much for a tooltip: a short form, a few actions, an explanation. It opens from a trigger, takes focus, and returns it when it closes. A side is by reading direction, so Start is on the left in English and on the right in Arabic.",
  placement: "Placement",
  placementNote:
    "The four sides. When there is no room on the chosen side the popover flips to the opposite one.",
  top: "Top",
  bottom: "Bottom",
  start: "Start",
  end: "End",
  sideTitle: "Opens on one side",
  sideBody: "This popover sits on the side you chose.",
  alignment: "Alignment",
  alignmentNote:
    "Along the edge the popover leaves open: Start lines up with the reading start of the trigger, End with its reading end.",
  alignStart: "Align start",
  alignCenter: "Align centre",
  alignEnd: "Align end",
  alignTitle: "Lined up with the trigger",
  alignBody: "The edge of this popover follows the trigger.",
  content: "Content",
  contentNote:
    "A title names the popover for a screen reader. Without one, aria-label does. The arrow ties the popover to its trigger, and the content can be a form.",
  titled: "With a title",
  titledTitle: "Delivery window",
  titledBody: "Orders placed before noon leave the same day.",
  arrow: "With an arrow",
  arrowTitle: "Pointing at its trigger",
  arrowBody: "The arrow shows which control opened this popover.",
  named: "Named by aria-label",
  namedLabel: "Order reference",
  namedBody: "The reference is ORD-1042.",
  form: "With a field",
  formTitle: "Rename the order",
  formField: "Order name",
  formSave: "Save name",
  dismissal: "Dismissal",
  dismissalNote:
    "By default Escape and a press outside close the popover. A step the user must finish refuses a press outside; a flow with unsaved work refuses Escape. Both then need a control inside, here Done.",
  dismissable: "Closes anywhere",
  dismissableTitle: "Quick note",
  dismissableBody: "Press Escape or anywhere outside to close.",
  step: "Refuses a press outside",
  stepTitle: "Finish this step",
  stepBody: "A press outside does not close this one. Use Done.",
  escape: "Refuses Escape",
  escapeTitle: "Unsaved changes",
  escapeBody: "Escape does not close this one. Use Done.",
  done: "Done",
  live: "Try it",
  liveNote:
    "A controlled popover. Open it from the button beside it; while it is open the page behind is out of reach, so closing is from inside.",
  liveTrigger: "Order actions",
  liveTitle: "Order actions",
  liveBody: "Choose what happens to the order.",
  liveOpen: "Open from outside",
  state: (isOpen: boolean) => `State: ${isOpen ? "open" : "closed"}`,
} as const;

/** The row that lays samples out in the middle of the page, where a popover has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** The width of a popover's surface, so every sample is the same size and the placement checks are steady. */
const SURFACE = "max-w-72";

/** One short paragraph of popover content; `<bdi>` keeps an English full stop at its end inside a right-to-left page. */
function Body({ children }: { readonly children: string }) {
  return (
    <Ui.Text>
      <bdi>{children}</bdi>
    </Ui.Text>
  );
}

/** Props of {@link ClosableSample}. */
interface ClosableSampleProps {
  /** The trigger's label. */
  readonly label: string;
  /** The popover's title. */
  readonly title: string;
  /** The sentence in the popover. */
  readonly body: string;
  /** Whether a press outside closes it. */
  readonly isDismissable: boolean;
  /** Whether Escape is kept from closing it. */
  readonly isKeyboardDismissDisabled: boolean;
}

/** A popover the page controls, so a button inside it can close it, as a step that refuses outside dismissal must. */
function ClosableSample({
  label,
  title,
  body,
  isDismissable,
  isKeyboardDismissDisabled,
}: ClosableSampleProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Ui.Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      title={title}
      className={SURFACE}
      trigger={<Ui.Button variant="secondary">{label}</Ui.Button>}
    >
      <div className="grid gap-3">
        <Body>{body}</Body>
        <div>
          <Ui.Button size="sm" onPress={() => setIsOpen(false)}>
            {STRINGS.done}
          </Ui.Button>
        </div>
      </div>
    </Ui.Popover>
  );
}

/** The Popover page. */
export function Popover() {
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{PopoverRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="popover-placement" title={STRINGS.placement} note={STRINGS.placementNote}>
        <ul className={ROW}>
          {(
            [
              ["top", STRINGS.top],
              ["bottom", STRINGS.bottom],
              ["start", STRINGS.start],
              ["end", STRINGS.end],
            ] as const
          ).map(([placement, label]) => (
            <li key={placement}>
              <Ui.Popover
                placement={placement}
                title={STRINGS.sideTitle}
                className={SURFACE}
                trigger={<Ui.Button variant="secondary">{label}</Ui.Button>}
              >
                <Body>{STRINGS.sideBody}</Body>
              </Ui.Popover>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="popover-alignment" title={STRINGS.alignment} note={STRINGS.alignmentNote}>
        <ul className={ROW}>
          {(
            [
              ["start", STRINGS.alignStart],
              ["center", STRINGS.alignCenter],
              ["end", STRINGS.alignEnd],
            ] as const
          ).map(([align, label]) => (
            <li key={align}>
              <Ui.Popover
                placement="bottom"
                align={align}
                title={STRINGS.alignTitle}
                className={SURFACE}
                trigger={<Ui.Button variant="secondary">{label}</Ui.Button>}
              >
                <Body>{STRINGS.alignBody}</Body>
              </Ui.Popover>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="popover-content" title={STRINGS.content} note={STRINGS.contentNote}>
        <ul className={ROW}>
          <li>
            <Ui.Popover
              title={STRINGS.titledTitle}
              className={SURFACE}
              trigger={<Ui.Button variant="secondary">{STRINGS.titled}</Ui.Button>}
            >
              <Body>{STRINGS.titledBody}</Body>
            </Ui.Popover>
          </li>
          <li>
            <Ui.Popover
              hasArrow
              title={STRINGS.arrowTitle}
              className={SURFACE}
              trigger={<Ui.Button variant="secondary">{STRINGS.arrow}</Ui.Button>}
            >
              <Body>{STRINGS.arrowBody}</Body>
            </Ui.Popover>
          </li>
          <li>
            <Ui.Popover
              aria-label={STRINGS.namedLabel}
              className={SURFACE}
              trigger={<Ui.Button variant="secondary">{STRINGS.named}</Ui.Button>}
            >
              <Body>{STRINGS.namedBody}</Body>
            </Ui.Popover>
          </li>
          <li>
            <Ui.Popover
              title={STRINGS.formTitle}
              className={SURFACE}
              trigger={<Ui.Button variant="secondary">{STRINGS.form}</Ui.Button>}
            >
              <div className="grid gap-3">
                <Ui.TextField label={STRINGS.formField} defaultValue="Spring order" />
                <div>
                  <Ui.Button size="sm">{STRINGS.formSave}</Ui.Button>
                </div>
              </div>
            </Ui.Popover>
          </li>
        </ul>
      </PageSection>

      <PageSection id="popover-dismissal" title={STRINGS.dismissal} note={STRINGS.dismissalNote}>
        <ul className={ROW}>
          <li>
            <Ui.Popover
              title={STRINGS.dismissableTitle}
              className={SURFACE}
              trigger={<Ui.Button variant="secondary">{STRINGS.dismissable}</Ui.Button>}
            >
              <Body>{STRINGS.dismissableBody}</Body>
            </Ui.Popover>
          </li>
          <li>
            <ClosableSample
              label={STRINGS.step}
              title={STRINGS.stepTitle}
              body={STRINGS.stepBody}
              isDismissable={false}
              isKeyboardDismissDisabled={false}
            />
          </li>
          <li>
            <ClosableSample
              label={STRINGS.escape}
              title={STRINGS.escapeTitle}
              body={STRINGS.escapeBody}
              isDismissable
              isKeyboardDismissDisabled
            />
          </li>
        </ul>
      </PageSection>

      <PageSection id="popover-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.Popover
            isOpen={isLiveOpen}
            onOpenChange={setIsLiveOpen}
            title={STRINGS.liveTitle}
            className={SURFACE}
            trigger={<Ui.Button variant="secondary">{STRINGS.liveTrigger}</Ui.Button>}
          >
            <Body>{STRINGS.liveBody}</Body>
          </Ui.Popover>
          <Ui.Button variant="tertiary" onPress={() => setIsLiveOpen(true)}>
            {STRINGS.liveOpen}
          </Ui.Button>
        </div>
        <Ui.Text role="status" data-testid="popover-state" tone="muted">
          {STRINGS.state(isLiveOpen)}
        </Ui.Text>
      </PageSection>
    </article>
  );
}
