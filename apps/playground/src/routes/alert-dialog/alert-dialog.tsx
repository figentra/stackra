/**
 * Stackra file contract:
 * Purpose: the page of the alert-dialog route: every tone of AlertDialog (default, accent, success, warning, danger),
 *          an icon of its own and none, the two dismissal switches (a press outside, and Escape), each opened from a
 *          button and answered in a status line, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. One dialog per sample, each
 *           controlled by the page's single `open` state, so only one is ever open. The tone icons come from the kit's own
 *           registry, and the custom icon from the shell's registry (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); ADR 0312; WAI-ARIA `alertdialog`;
 *          WCAG 2.2 SC 2.1.2, 2.5.8 and 4.1.2.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { AlertDialogRoute } from "#src/routes/alert-dialog/alert-dialog.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::alert-dialog.*` keys.
const STRINGS = {
  documentTitle: `${AlertDialogRoute.title} · Stackra Playground`,
  intro:
    "AlertDialog interrupts the user to confirm or refuse one decision. It is named by its title, described by its description, and focus starts on the safe button, Cancel. A press outside does not decide; Escape refuses.",
  tones: "Tones",
  tonesNote:
    "The tone sets the icon and its colour; the confirm button turns red for danger. The words, not the colour, carry the meaning.",
  icons: "Icons",
  iconsNote: "An icon of your own in place of the tone's, and none at all.",
  dismissal: "Dismissal",
  dismissalNote:
    "By default only the buttons and Escape answer. Turn on a press outside, or turn Escape off for a step the user must answer with a button.",
  answer: "Last answer",
  noAnswer: "No answer yet.",
  confirmed: (name: string) => `${name}: confirmed.`,
  cancelled: (name: string) => `${name}: cancelled.`,
} as const;

/** One sample: the button that opens it, and the dialog it opens. */
interface Sample {
  readonly id: string;
  readonly group: "tones" | "icons" | "dismissal";
  readonly trigger: string;
  readonly title: string;
  readonly description: string;
  readonly confirm: string;
  readonly cancel: string;
  readonly props?: Pick<
    Ui.AlertDialogProps,
    "tone" | "icon" | "isDismissable" | "isKeyboardDismissDisabled"
  >;
}

const SAMPLES: readonly Sample[] = [
  {
    id: "default",
    group: "tones",
    trigger: "Default tone",
    title: "Publish this page?",
    description: "Everyone with the link will be able to read it.",
    confirm: "Publish",
    cancel: "Not yet",
  },
  {
    id: "accent",
    group: "tones",
    trigger: "Accent tone",
    title: "Invite the whole team?",
    description: "Forty people will get an email today.",
    confirm: "Send invitations",
    cancel: "Not now",
    props: { tone: "accent" },
  },
  {
    id: "success",
    group: "tones",
    trigger: "Success tone",
    title: "Mark the order as shipped?",
    description: "The customer is told straight away.",
    confirm: "Mark as shipped",
    cancel: "Not yet",
    props: { tone: "success" },
  },
  {
    id: "warning",
    group: "tones",
    trigger: "Warning tone",
    title: "Close the project with open tasks?",
    description: "Three tasks are still open and will be archived.",
    confirm: "Close project",
    cancel: "Keep it open",
    props: { tone: "warning" },
  },
  {
    id: "danger",
    group: "tones",
    trigger: "Danger tone",
    title: "Delete this project?",
    description: "This cannot be undone.",
    confirm: "Delete project",
    cancel: "Keep project",
    props: { tone: "danger" },
  },
  {
    id: "custom-icon",
    group: "icons",
    trigger: "Custom icon",
    title: "Empty the trash?",
    description: "Everything in it is deleted for good.",
    confirm: "Empty trash",
    cancel: "Keep it",
    props: { tone: "danger", icon: "trash" },
  },
  {
    id: "no-icon",
    group: "icons",
    trigger: "No icon",
    title: "Sign out of every device?",
    description: "You will have to sign in again everywhere.",
    confirm: "Sign out everywhere",
    cancel: "Stay signed in",
    props: { icon: false },
  },
  {
    id: "dismissable",
    group: "dismissal",
    trigger: "Press outside answers",
    title: "Leave this team?",
    description: "A press on the backdrop refuses, as Cancel does.",
    confirm: "Leave team",
    cancel: "Stay",
    props: { isDismissable: true },
  },
  {
    id: "no-escape",
    group: "dismissal",
    trigger: "Escape disabled",
    title: "Accept the new terms?",
    description: "Only the buttons answer; Escape does nothing.",
    confirm: "Accept",
    cancel: "Decline",
    props: { isKeyboardDismissDisabled: true },
  },
];

/** The list that lays the opening buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The AlertDialog page. */
export function AlertDialog() {
  const [open, setOpen] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>(STRINGS.noAnswer);

  const buttons = (group: Sample["group"]) => (
    <ul className={ROW}>
      {SAMPLES.filter((sample) => sample.group === group).map((sample) => (
        <li key={sample.id}>
          <Ui.Button variant="secondary" onPress={() => setOpen(sample.id)}>
            {sample.trigger}
          </Ui.Button>
        </li>
      ))}
    </ul>
  );

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{AlertDialogRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="alert-dialog-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        {buttons("tones")}
      </PageSection>
      <PageSection id="alert-dialog-icons" title={STRINGS.icons} note={STRINGS.iconsNote}>
        {buttons("icons")}
      </PageSection>
      <PageSection
        id="alert-dialog-dismissal"
        title={STRINGS.dismissal}
        note={STRINGS.dismissalNote}
      >
        {buttons("dismissal")}
      </PageSection>

      <PageSection id="alert-dialog-answer" title={STRINGS.answer}>
        <Ui.Text role="status">
          <bdi>{answer}</bdi>
        </Ui.Text>
      </PageSection>

      {SAMPLES.map((sample) => (
        <Ui.AlertDialog
          key={sample.id}
          {...sample.props}
          isOpen={open === sample.id}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen((current) => (current === sample.id ? null : current));
          }}
          title={sample.title}
          description={sample.description}
          confirmLabel={sample.confirm}
          cancelLabel={sample.cancel}
          onConfirm={() => setAnswer(STRINGS.confirmed(sample.trigger))}
          onCancel={() => setAnswer(STRINGS.cancelled(sample.trigger))}
        />
      ))}
    </article>
  );
}
