/**
 * Stackra file contract:
 * Purpose: the page of the use-confirmation route: `useConfirmation()` asking a plain question, a danger question and
 *          one that makes the user type a name first, each as `if (await confirm({ ... }))` in a press handler, with
 *          the answer in a status line and a counter that only the confirmed deletion moves, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The page mounts its own
 *           `ConfirmationProvider`; an app mounts it once, near its root. The tone icons come from `ToneIcons`
 *           (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8, 3.3.4 and
 *          4.1.2.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ToneIcons } from "#src/components/tone-icons";
import { UseConfirmationRoute } from "#src/routes/use-confirmation/use-confirmation.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::use-confirmation.*` keys.
const STRINGS = {
  documentTitle: `${UseConfirmationRoute.title} · Stackra Playground`,
  intro:
    "useConfirmation() returns a function that asks a question and waits for the answer: true only when the user confirms, false for Cancel, Escape and a replaced question. One provider draws the dialog for the whole app.",
  questions: "Questions",
  questionsNote:
    "Each button asks in its handler and acts on the answer. The counter moves only when the deletion is confirmed.",
  plain: "Archive project",
  danger: "Delete project",
  typed: "Delete workspace",
  answer: "Last answer",
  noAnswer: "No answer yet.",
  yes: (name: string) => `${name}: confirmed.`,
  no: (name: string) => `${name}: declined.`,
  deleted: (count: number) => `Workspaces deleted: ${count}.`,
} as const;

/** The list that lays the opening buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The questions and the status line; they sit inside the provider, because the hook reads it. */
function Questions() {
  const confirm = Ui.useConfirmation();
  const [answer, setAnswer] = useState<string>(STRINGS.noAnswer);
  const [deleted, setDeleted] = useState(0);

  const ask = async (name: string, options: Parameters<typeof confirm>[0]) => {
    const isConfirmed = await confirm(options);
    setAnswer(isConfirmed ? STRINGS.yes(name) : STRINGS.no(name));
    return isConfirmed;
  };

  const deleteWorkspace = async () => {
    const isConfirmed = await ask(STRINGS.typed, {
      title: "Delete the Acme workspace?",
      description: "Every project in it is deleted too. This cannot be undone.",
      confirmLabel: "Delete Acme",
      cancelLabel: "Keep Acme",
      tone: "danger",
      confirmationText: "Acme",
      confirmationLabel: 'Type "Acme" to confirm',
    });
    if (isConfirmed) setDeleted((count) => count + 1);
  };

  return (
    <>
      <PageSection
        id="use-confirmation-questions"
        title={STRINGS.questions}
        note={STRINGS.questionsNote}
      >
        <ul className={ROW}>
          <li>
            <Ui.Button
              variant="secondary"
              onPress={() =>
                void ask(STRINGS.plain, {
                  title: "Archive this project?",
                  description: "It leaves the list but can be restored later.",
                  confirmLabel: "Archive",
                  cancelLabel: "Keep active",
                })
              }
            >
              {STRINGS.plain}
            </Ui.Button>
          </li>
          <li>
            <Ui.Button
              variant="danger-soft"
              onPress={() =>
                void ask(STRINGS.danger, {
                  title: "Delete this project?",
                  description: "This cannot be undone.",
                  confirmLabel: "Yes, delete it",
                  cancelLabel: "Keep project",
                  tone: "danger",
                })
              }
            >
              {STRINGS.danger}
            </Ui.Button>
          </li>
          <li>
            <Ui.Button variant="danger-soft" onPress={() => void deleteWorkspace()}>
              {STRINGS.typed}
            </Ui.Button>
          </li>
        </ul>
        <Ui.Text>
          <bdi>{STRINGS.deleted(deleted)}</bdi>
        </Ui.Text>
      </PageSection>

      <PageSection id="use-confirmation-answer" title={STRINGS.answer}>
        <Ui.Text role="status">
          <bdi>{answer}</bdi>
        </Ui.Text>
      </PageSection>
    </>
  );
}

/** The useConfirmation page. */
export function UseConfirmation() {
  return (
    <ToneIcons>
      <Ui.ConfirmationProvider>
        <article className="grid gap-10">
          <title>{STRINGS.documentTitle}</title>
          <header className="grid gap-2">
            <Ui.Heading level={1}>{UseConfirmationRoute.title}</Ui.Heading>
            <Ui.Text className="max-w-prose">
              <bdi>{STRINGS.intro}</bdi>
            </Ui.Text>
          </header>
          <Questions />
        </article>
      </Ui.ConfirmationProvider>
    </ToneIcons>
  );
}
