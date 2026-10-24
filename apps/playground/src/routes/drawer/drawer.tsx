/**
 * Stackra file contract:
 * Purpose: the page of the drawer route: a drawer on each of the four edges (start and end follow the reading
 *          direction, so end is the right in English and the left in Arabic), the three dismissal settings (the
 *          default, outside press off, Escape off), a long body that scrolls inside the drawer, and a live example
 *          whose controlled drawer holds a setting and reports it, all from `@stackra/ui/react` with real props.
 *          Every sample opens from its own trigger button.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. A footer button with
 *           `slot="close"` closes its drawer without state; the live example drives its drawer with `isOpen`. The long
 *           body takes `tabIndex={0}` so a keyboard user can scroll it (WCAG 2.2 SC 2.1.1).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL);
 *          WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { DrawerRoute } from "#src/routes/drawer/drawer.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::drawer.*` keys.
const STRINGS = {
  documentTitle: `${DrawerRoute.title} · Stackra Playground`,
  intro:
    "A drawer is a panel that slides in from an edge, for a detail or an edit that should not take over the page. It blocks the page behind it like a modal does: focus stays inside, the page is hidden from screen readers, and focus returns to the button that opened it. Its title names it.",
  placement: "Placement",
  placementNote:
    "Start and end follow the reading direction, so end is on the right in English and on the left in Arabic. End is the default.",
  dismissal: "Dismissal",
  dismissalNote:
    "By default a press outside the drawer and the Escape key close it. A step the user must finish turns them off and keeps its own close button.",
  live: "Try it",
  liveNote: "A controlled drawer: Apply closes it and keeps the setting, Cancel keeps the old one.",
  long: "Long content",
  longNote: "A long body scrolls inside the drawer; the header and footer stay in place.",
  close: "Close",
  done: "Done",
  cancel: "Cancel",
  apply: "Apply",
  body: "This is the body of the drawer. It holds any content: text, a form or a list.",
  placementTitle: "Drawer placement",
  dismissalTitle: "Drawer dismissal",
  openStart: "Open from start",
  openEnd: "Open from end",
  openTop: "Open from top",
  openBottom: "Open from bottom",
  openDefault: "Open default",
  openOutsideOff: "Open with outside press off",
  openEscapeOff: "Open with Escape off",
  outsideOffBody: "A press outside the drawer does not close it. Use Close or Cancel.",
  escapeOffBody: "The Escape key does not close it. A press outside, Close and Cancel still do.",
  openSettings: "Open settings",
  settingsTitle: "Notification settings",
  emailNotifications: "Email notifications",
  notifications: "Notifications:",
  on: "on",
  off: "off",
  openLong: "Open long content",
  longTitle: "Activity log",
  longBody:
    "An entry of the log. The body keeps scrolling while the title above and the buttons below stay where they are, so the user can always reach them.",
} as const;

/** The list that lays triggers out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The edges the drawer opens on, each with the label of the button that opens it. */
const PLACEMENTS = [
  { placement: "start", label: STRINGS.openStart },
  { placement: "end", label: STRINGS.openEnd },
  { placement: "top", label: STRINGS.openTop },
  { placement: "bottom", label: STRINGS.openBottom },
] as const;

/** Thirty entries, enough to overflow the drawer in a normal window. */
const ENTRIES = Array.from({ length: 30 }, (_, index) => `${index + 1}. ${STRINGS.longBody}`);

/** Props of {@link Sample}. */
interface SampleProps extends Pick<
  Ui.DrawerProps,
  "placement" | "isDismissable" | "isKeyboardDismissDisabled"
> {
  /** The label of the button that opens the drawer. */
  readonly buttonLabel: string;
  /** The drawer's title. */
  readonly title: string;
  /** The sentence in the drawer's body. */
  readonly body: string;
}

/** One drawer with its own trigger button, a close button, a title, a body sentence and a Cancel button. */
function Sample({ buttonLabel, title, body, ...drawerProps }: SampleProps) {
  return (
    <Ui.Drawer trigger={<Ui.Button variant="secondary">{buttonLabel}</Ui.Button>} {...drawerProps}>
      <Ui.Drawer.Close label={STRINGS.close} />
      <Ui.Drawer.Header>
        <Ui.Drawer.Title>{title}</Ui.Drawer.Title>
      </Ui.Drawer.Header>
      <Ui.Drawer.Body>
        <Ui.Text>
          <bdi>{body}</bdi>
        </Ui.Text>
      </Ui.Drawer.Body>
      <Ui.Drawer.Footer>
        <Ui.Button variant="secondary" slot="close">
          {STRINGS.cancel}
        </Ui.Button>
      </Ui.Drawer.Footer>
    </Ui.Drawer>
  );
}

/** The Drawer page. */
export function Drawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEmailOn, setIsEmailOn] = useState(true);
  const [draft, setDraft] = useState(isEmailOn);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{DrawerRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="drawer-placement" title={STRINGS.placement} note={STRINGS.placementNote}>
        <ul className={ROW}>
          {PLACEMENTS.map(({ placement, label }) => (
            <li key={placement}>
              <Sample
                buttonLabel={label}
                title={STRINGS.placementTitle}
                body={STRINGS.body}
                placement={placement}
              />
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="drawer-dismissal" title={STRINGS.dismissal} note={STRINGS.dismissalNote}>
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

      <PageSection id="drawer-long" title={STRINGS.long} note={STRINGS.longNote}>
        <div>
          <Ui.Drawer trigger={<Ui.Button variant="secondary">{STRINGS.openLong}</Ui.Button>}>
            <Ui.Drawer.Close label={STRINGS.close} />
            <Ui.Drawer.Header>
              <Ui.Drawer.Title>{STRINGS.longTitle}</Ui.Drawer.Title>
            </Ui.Drawer.Header>
            <Ui.Drawer.Body tabIndex={0}>
              {ENTRIES.map((entry) => (
                <Ui.Text key={entry}>
                  <bdi>{entry}</bdi>
                </Ui.Text>
              ))}
            </Ui.Drawer.Body>
            <Ui.Drawer.Footer>
              <Ui.Button slot="close">{STRINGS.done}</Ui.Button>
            </Ui.Drawer.Footer>
          </Ui.Drawer>
        </div>
      </PageSection>

      <PageSection id="drawer-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid max-w-sm gap-3">
          <div>
            <Ui.Button
              onPress={() => {
                setDraft(isEmailOn);
                setIsOpen(true);
              }}
            >
              {STRINGS.openSettings}
            </Ui.Button>
          </div>
          <Ui.Text role="status">
            <bdi>{`${STRINGS.notifications} ${isEmailOn ? STRINGS.on : STRINGS.off}`}</bdi>
          </Ui.Text>
          <Ui.Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
            <Ui.Drawer.Close label={STRINGS.close} />
            <Ui.Drawer.Header>
              <Ui.Drawer.Title>{STRINGS.settingsTitle}</Ui.Drawer.Title>
            </Ui.Drawer.Header>
            <Ui.Drawer.Body>
              <Ui.Switch label={STRINGS.emailNotifications} value={draft} onChange={setDraft} />
            </Ui.Drawer.Body>
            <Ui.Drawer.Footer>
              <Ui.Button variant="secondary" slot="close">
                {STRINGS.cancel}
              </Ui.Button>
              <Ui.Button
                onPress={() => {
                  setIsEmailOn(draft);
                  setIsOpen(false);
                }}
              >
                {STRINGS.apply}
              </Ui.Button>
            </Ui.Drawer.Footer>
          </Ui.Drawer>
        </div>
      </PageSection>
    </article>
  );
}
