/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ConfirmationProvider` and `useConfirmation` (@stackra/ui): a
 *          plain question awaited as a boolean, a destructive one, a question with a custom icon, and one that asks
 *          for a name to be typed before the confirming button works; each reports the answer it resolved with.
 * Boundary: presentation and local demo state only; the provider and the hook are @stackra/ui's, nothing here is
 *          styled by hand. The provider is mounted by the page, inside the screen's own container, because the app
 *          root does not mount one.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { ConfirmationOptions } from "@stackra/ui/contracts";
import { Button, ConfirmationProvider, Text, useConfirmation } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";
import { Icons } from "#src/constants/icons.constant";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "A plain question",
    description:
      "`confirm(options)` shows the dialog and resolves true on a yes, false on a refusal; the handler just awaits it.",
    open: "Archive the project",
    question: "Archive project Atlas?",
    body: "You can restore it from the archive at any time.",
    confirm: "Archive",
    cancel: "Cancel",
  },
  danger: {
    title: "A destructive question",
    description: "The `danger` tone colours the icon and the confirming button.",
    open: "Remove the member",
    question: "Remove Ada Lovelace?",
    body: "She loses access to every project at once.",
    confirm: "Remove member",
    cancel: "Keep member",
  },
  icon: {
    title: "A custom icon",
    description: "`icon` replaces the tone's icon with another by name, and `false` draws none.",
    open: "Turn on reminders",
    question: "Turn on reminders?",
    body: "You will get a nudge the day before each deadline.",
    confirm: "Turn on",
    cancel: "Not now",
  },
  typed: {
    title: "A name to type",
    description:
      "`confirmationText` keeps the confirming button off until the user types it, and `confirmationLabel` names the field.",
    open: "Delete with a typed name",
    question: "Delete project Atlas?",
    body: "This cannot be undone.",
    field: "Type “Atlas” to confirm",
    confirm: "Delete project",
    cancel: "Keep project",
  },
  live: {
    title: "The answer",
    description: "Every question resolves to a boolean; the readout shows the last one.",
    answered: (name: string, answer: boolean) => `${name}: ${answer ? "yes" : "no"}`,
    none: "No question answered yet.",
  },
} as const;

/** One section of the page: its words, the button that asks the question and the question itself. */
interface Question {
  /** The section's heading and description. */
  readonly copy: { readonly title: string; readonly description: string };
  /** The text of the button that asks. */
  readonly open: string;
  /** What `confirm` is given. */
  readonly options: ConfirmationOptions;
}

/** The questions of the page, one section each. */
const QUESTIONS: readonly Question[] = [
  {
    copy: STRINGS.basics,
    open: STRINGS.basics.open,
    options: {
      title: STRINGS.basics.question,
      description: STRINGS.basics.body,
      confirmLabel: STRINGS.basics.confirm,
      cancelLabel: STRINGS.basics.cancel,
    },
  },
  {
    copy: STRINGS.danger,
    open: STRINGS.danger.open,
    options: {
      tone: "danger",
      title: STRINGS.danger.question,
      description: STRINGS.danger.body,
      confirmLabel: STRINGS.danger.confirm,
      cancelLabel: STRINGS.danger.cancel,
    },
  },
  {
    copy: STRINGS.icon,
    open: STRINGS.icon.open,
    options: {
      tone: "accent",
      icon: Icons.Bell,
      title: STRINGS.icon.question,
      description: STRINGS.icon.body,
      confirmLabel: STRINGS.icon.confirm,
      cancelLabel: STRINGS.icon.cancel,
    },
  },
  {
    copy: STRINGS.typed,
    open: STRINGS.typed.open,
    options: {
      tone: "danger",
      title: STRINGS.typed.question,
      description: STRINGS.typed.body,
      confirmLabel: STRINGS.typed.confirm,
      cancelLabel: STRINGS.typed.cancel,
      confirmationText: "Atlas",
      confirmationLabel: STRINGS.typed.field,
    },
  },
];

/** The sections of the page; they call the hook, so they sit below the provider. */
function Questions() {
  const confirm = useConfirmation();
  const [answer, setAnswer] = useState<string | null>(null);

  /** Asks the question, waits for the boolean and shows it under the button's name. */
  const ask = async ({ open, options }: Question) => {
    setAnswer(STRINGS.live.answered(open, await confirm(options)));
  };

  return (
    <>
      {QUESTIONS.map((question) => (
        <Section
          key={question.copy.title}
          title={question.copy.title}
          description={question.copy.description}
        >
          <Button variant="secondary" onPress={() => void ask(question)}>
            {question.open}
          </Button>
        </Section>
      ))}

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {answer ?? STRINGS.live.none}
        </Text>
      </Section>
    </>
  );
}

/** The useConfirmation page: one section per kind of question, in a scrollable screen. */
export function UseConfirmationScreen() {
  return (
    <Screen>
      <ConfirmationProvider>
        <Questions />
      </ConfirmationProvider>
    </Screen>
  );
}
