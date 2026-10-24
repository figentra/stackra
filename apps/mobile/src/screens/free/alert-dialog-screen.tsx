/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `AlertDialog` (@stackra/ui): a plain question, a destructive
 *          one, one a press outside can refuse, one with a custom icon and none, and one whose confirming button waits
 *          for a name to be typed; each reports how it was answered.
 * Boundary: presentation and local demo state only; the dialog is @stackra/ui's, nothing here is styled by hand. The
 *          dialog has no trigger of its own, so each sample holds its open state and a button that opens it.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { AlertDialog, Button, Text, TextField, type AlertDialogProps } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "A plain question",
    description: "Two buttons and a title; nothing outside the dialog can answer it.",
    open: "Discard the draft",
    question: "Discard this draft?",
    body: "The draft has not been saved.",
    confirm: "Discard",
    cancel: "Keep editing",
  },
  danger: {
    title: "A destructive question",
    description: "The `danger` tone colours the icon and the confirming button.",
    open: "Delete the project",
    question: "Delete project Atlas?",
    body: "Its 14 tasks and 3 files are deleted for ever.",
    confirm: "Delete project",
    cancel: "Keep project",
  },
  dismissable: {
    title: "A press outside refuses",
    description: "`isDismissable` lets a press outside the dialog count as a refusal.",
    open: "Sign out",
    question: "Sign out of this device?",
    body: "You will need your password to sign in again.",
    confirm: "Sign out",
    cancel: "Stay signed in",
  },
  icons: {
    title: "Icons",
    description: "`icon` replaces the tone's icon with another by name, and `false` draws none.",
    custom: "Open with a bell",
    customQuestion: "Turn on notifications?",
    none: "Open with no icon",
    noneQuestion: "Send the invoice now?",
    confirm: "Yes",
    cancel: "Not now",
  },
  typed: {
    title: "A name to type",
    description:
      "`isConfirmDisabled` refuses the confirming press until the decision is ready: type the project's name.",
    open: "Delete with a typed name",
    question: "Delete project Atlas?",
    body: "This cannot be undone.",
    field: "Type “Atlas” to confirm",
    confirm: "Delete project",
    cancel: "Keep project",
  },
  live: {
    title: "Try it",
    description: "Answer any dialog above; the readout says which one and how.",
    answered: (name: string, answer: string) => `${name}: ${answer}`,
    confirmed: "confirmed",
    refused: "refused",
    none: "No dialog answered yet.",
  },
} as const;

/** What a sample reports when its dialog is answered. */
type Report = (name: string, answer: string) => void;

/** The props one sample gives the dialog; the open state and the answers are the sample's own. */
type SampleDialogProps = Omit<
  AlertDialogProps,
  "isOpen" | "onOpenChange" | "onConfirm" | "onCancel"
>;

/** A button that opens an alert dialog and reports how it was answered under the button's name. */
function DialogSample({
  open,
  report,
  ...dialog
}: SampleDialogProps & { readonly open: string; readonly report: Report }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {open}
      </Button>
      <AlertDialog
        {...dialog}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={() => report(open, STRINGS.live.confirmed)}
        onCancel={() => report(open, STRINGS.live.refused)}
      />
    </>
  );
}

/** The dialog whose confirming button waits for the project's name to be typed. */
function TypedSample({ report }: { readonly report: Report }) {
  const [typed, setTyped] = useState("");
  return (
    <DialogSample
      open={STRINGS.typed.open}
      report={report}
      tone="danger"
      title={STRINGS.typed.question}
      description={STRINGS.typed.body}
      confirmLabel={STRINGS.typed.confirm}
      cancelLabel={STRINGS.typed.cancel}
      isConfirmDisabled={typed.trim() !== "Atlas"}
    >
      <TextField
        label={STRINGS.typed.field}
        value={typed}
        onChange={setTyped}
        autoCapitalize="none"
      />
    </DialogSample>
  );
}

/** The AlertDialog page: one section per option, in a scrollable screen. */
export function AlertDialogScreen() {
  const [answer, setAnswer] = useState<string | null>(null);
  const report: Report = (name, how) => setAnswer(STRINGS.live.answered(name, how));

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <DialogSample
          open={STRINGS.basics.open}
          report={report}
          title={STRINGS.basics.question}
          description={STRINGS.basics.body}
          confirmLabel={STRINGS.basics.confirm}
          cancelLabel={STRINGS.basics.cancel}
        />
      </Section>

      <Section title={STRINGS.danger.title} description={STRINGS.danger.description}>
        <DialogSample
          open={STRINGS.danger.open}
          report={report}
          tone="danger"
          title={STRINGS.danger.question}
          description={STRINGS.danger.body}
          confirmLabel={STRINGS.danger.confirm}
          cancelLabel={STRINGS.danger.cancel}
        />
      </Section>

      <Section title={STRINGS.dismissable.title} description={STRINGS.dismissable.description}>
        <DialogSample
          open={STRINGS.dismissable.open}
          report={report}
          tone="warning"
          isDismissable
          title={STRINGS.dismissable.question}
          description={STRINGS.dismissable.body}
          confirmLabel={STRINGS.dismissable.confirm}
          cancelLabel={STRINGS.dismissable.cancel}
        />
      </Section>

      <Section title={STRINGS.icons.title} description={STRINGS.icons.description}>
        <DialogSample
          open={STRINGS.icons.custom}
          report={report}
          tone="accent"
          icon="bell"
          title={STRINGS.icons.customQuestion}
          confirmLabel={STRINGS.icons.confirm}
          cancelLabel={STRINGS.icons.cancel}
        />
        <DialogSample
          open={STRINGS.icons.none}
          report={report}
          icon={false}
          title={STRINGS.icons.noneQuestion}
          confirmLabel={STRINGS.icons.confirm}
          cancelLabel={STRINGS.icons.cancel}
        />
      </Section>

      <Section title={STRINGS.typed.title} description={STRINGS.typed.description}>
        <TypedSample report={report} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {answer ?? STRINGS.live.none}
        </Text>
      </Section>
    </Screen>
  );
}
