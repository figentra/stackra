/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native form parts (@stackra/ui): `Label` in each state,
 *          `Description` under a field, `FieldError` shown and hidden by `isInvalid`, and a live `Form` that checks
 *          the email when it is sent.
 * Boundary: presentation and local demo state only; the parts are @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import {
  Button,
  Description,
  FieldError,
  Form,
  Label,
  Text,
  TextArea,
  TextField,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  label: {
    title: "Label",
    description: "Each state of `Label`. The asterisk marks a required field.",
    default: "Default label",
    required: "Required label",
    invalid: "Invalid label",
    disabled: "Disabled label",
  },
  description: {
    title: "Description",
    description: "Help text under a field, read out with it.",
    field: "Display name",
    hint: "Shown on invoices. You can change it later.",
  },
  fieldError: {
    title: "Field error",
    description:
      "The message under an invalid field, shown while `isInvalid` is true. The second one is mounted with `isInvalid` false, so nothing is drawn.",
    message: "Enter a value before you continue.",
    validNote: "Below this line a FieldError with isInvalid false draws nothing.",
  },
  live: {
    title: "Try it",
    description: "A form that checks the email when you send it.",
    email: "Email",
    emailHint: "We reply to this address.",
    emailError: "Enter an email address, such as name@example.com.",
    notes: "Notes",
    notesHint: "Optional.",
    submit: "Send",
    notSent: "Nothing sent yet.",
    refused: "Not sent: the email is not valid.",
    sent: (count: number, email: string) =>
      `Sent ${count} time${count === 1 ? "" : "s"}, to ${email}.`,
  },
} as const;

/** An address with something on both sides of one at sign and a dot after it: enough for a demo. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The live form: an email checked on send, optional notes, and a readout of the last attempt. */
function LiveForm() {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [sent, setSent] = useState(0);
  const [status, setStatus] = useState<string>(STRINGS.live.notSent);

  const submit = () => {
    if (!EMAIL.test(email)) {
      setIsInvalid(true);
      setStatus(STRINGS.live.refused);
      return;
    }
    setIsInvalid(false);
    setSent(sent + 1);
    setStatus(STRINGS.live.sent(sent + 1, email));
  };

  return (
    <Form style={{ gap: 16 }}>
      <TextField
        label={STRINGS.live.email}
        description={STRINGS.live.emailHint}
        errorMessage={STRINGS.live.emailError}
        type="email"
        isRequired
        isInvalid={isInvalid}
        value={email}
        onChange={setEmail}
      />
      <TextArea
        label={STRINGS.live.notes}
        description={STRINGS.live.notesHint}
        rows={3}
        value={notes}
        onChange={setNotes}
      />
      <Button onPress={submit}>{STRINGS.live.submit}</Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {status}
      </Text>
    </Form>
  );
}

/** The form parts page: one section per part, in a scrollable screen. */
export function FormScreen() {
  return (
    <Screen>
      <Section title={STRINGS.label.title} description={STRINGS.label.description}>
        <View className="gap-2">
          <Label>{STRINGS.label.default}</Label>
          <Label isRequired>{STRINGS.label.required}</Label>
          <Label isInvalid>{STRINGS.label.invalid}</Label>
          <Label isDisabled>{STRINGS.label.disabled}</Label>
        </View>
      </Section>

      <Section title={STRINGS.description.title} description={STRINGS.description.description}>
        <View className="gap-1">
          <Label>{STRINGS.description.field}</Label>
          <Description>{STRINGS.description.hint}</Description>
        </View>
      </Section>

      <Section title={STRINGS.fieldError.title} description={STRINGS.fieldError.description}>
        <FieldError isInvalid>{STRINGS.fieldError.message}</FieldError>
        <Text type="small" tone="muted">
          {STRINGS.fieldError.validNote}
        </Text>
        <FieldError isInvalid={false}>{STRINGS.fieldError.message}</FieldError>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveForm />
      </Section>
    </Screen>
  );
}
