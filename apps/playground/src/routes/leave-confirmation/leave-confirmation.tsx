/**
 * Stackra file contract:
 * Purpose: the page of the leave-confirmation route: a note the user edits, a Save button, and a "Leave this page"
 *          button that asks through `LeaveConfirmation`'s `confirmLeave()` the way a router blocker would: while the
 *          note is unsaved it asks "discard your changes?", and once saved it lets the user go without a question; a
 *          status line says whether the user left or stayed, and another says whether the browser will ask before the
 *          tab closes. All from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The page owns no router: leaving
 *           is simulated by a status line, which is the seam an app's navigation code fills (React Router's
 *           `useBlocker`, bound later in `@stackra/navigation`). The tone icon comes from `ToneIcons` (ADR 0303
 *           decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8, 3.3.4 and
 *          4.1.2.
 */
import type { LeaveConfirmationHandle } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ToneIcons } from "#src/components/tone-icons";
import { LeaveConfirmationRoute } from "#src/routes/leave-confirmation/leave-confirmation.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::leave-confirmation.*` keys.
const STRINGS = {
  documentTitle: `${LeaveConfirmationRoute.title} · Stackra Playground`,
  intro:
    "LeaveConfirmation guards unsaved work. While there is some, the browser asks before the tab closes, and the app asks through confirmLeave() before it navigates away. It knows no router: the app's navigation code calls it and acts on the answer.",
  draft: "Unsaved changes",
  draftNote:
    "Edit the note to make it unsaved, then try to leave. Save the note and leaving costs nothing.",
  noteLabel: "Note",
  notePlaceholder: "Write something",
  save: "Save",
  leave: "Leave this page",
  dirty: "Unsaved changes: yes. The browser will ask before the tab closes.",
  clean: "Unsaved changes: none. The browser will not ask.",
  answer: "Last answer",
  noAnswer: "You are still on this page.",
  left: "You left the page.",
  stayed: "You stayed on the page.",
  title: "Discard unsaved changes?",
  description: "Your edits to this note will be lost.",
  stay: "Stay on page",
  discard: "Discard changes",
} as const;

/** The list that lays the buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The LeaveConfirmation page. */
export function LeaveConfirmation() {
  const leave = useRef<LeaveConfirmationHandle>(null);
  const [saved, setSaved] = useState("");
  const [note, setNote] = useState("");
  const [answer, setAnswer] = useState<string>(STRINGS.noAnswer);
  const isDirty = note !== saved;

  const tryToLeave = async () => {
    const mayLeave = (await leave.current?.confirmLeave()) ?? false;
    if (mayLeave) {
      // Leaving drops what was not saved, as a real navigation would.
      setNote(saved);
      setAnswer(STRINGS.left);
    } else {
      setAnswer(STRINGS.stayed);
    }
  };

  return (
    <ToneIcons>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{LeaveConfirmationRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="leave-confirmation-draft" title={STRINGS.draft} note={STRINGS.draftNote}>
          <div className="grid max-w-sm gap-4">
            <Ui.TextField
              label={STRINGS.noteLabel}
              placeholder={STRINGS.notePlaceholder}
              value={note}
              onChange={setNote}
            />
            <ul className={ROW}>
              <li>
                <Ui.Button onPress={() => setSaved(note)} isDisabled={!isDirty}>
                  {STRINGS.save}
                </Ui.Button>
              </li>
              <li>
                <Ui.Button variant="secondary" onPress={() => void tryToLeave()}>
                  {STRINGS.leave}
                </Ui.Button>
              </li>
            </ul>
            <Ui.Text tone="muted">
              <bdi>{isDirty ? STRINGS.dirty : STRINGS.clean}</bdi>
            </Ui.Text>
          </div>
        </PageSection>

        <PageSection id="leave-confirmation-answer" title={STRINGS.answer}>
          <Ui.Text role="status">
            <bdi>{answer}</bdi>
          </Ui.Text>
        </PageSection>

        <Ui.LeaveConfirmation
          ref={leave}
          when={isDirty}
          title={STRINGS.title}
          description={STRINGS.description}
          stayLabel={STRINGS.stay}
          discardLabel={STRINGS.discard}
        />
      </article>
    </ToneIcons>
  );
}
