/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `TextArea` (@stackra/ui): both variants, each part, the
 *          number of lines, each state, the width, and a live message with a character count and a limit.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Surface, Text, TextArea } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** The live message's limit, in characters. */
const LIMIT = 40;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants",
    description:
      "`primary` sits on the page; `secondary` is for a surface that is already tinted, so it is shown on one.",
    primary: "Primary area",
    secondary: "Secondary area",
  },
  parts: {
    title: "Parts",
    description: "Each part appears only when it is given.",
    labelOnly: "Label only",
    withPlaceholder: "With a placeholder",
    placeholder: "Tell us what happened",
    withDescription: "With a description",
    hint: "Include the order number if you have one.",
  },
  lines: {
    title: "Lines",
    description: "`rows`: two lines and six lines; React Native shows it on Android only.",
    two: "Two lines",
    six: "Six lines",
  },
  states: {
    title: "States",
    description:
      "Required adds the asterisk, invalid shows the error, disabled and read-only keep the value.",
    required: "Required area",
    invalid: "Invalid area",
    invalidMessage: "Write at least ten characters.",
    disabled: "Disabled area",
    readOnly: "Read-only area",
    kept: "Kept value",
  },
  width: {
    title: "Width",
    description: "`isFullWidth` is the default; turn it off to size to the content.",
    full: "Full width area",
    content: "Content width area",
  },
  live: {
    title: "Try it",
    description: `A message of at most ${LIMIT} characters: the count follows the text and the area turns invalid past it.`,
    label: "Message",
    hint: "Keep it short.",
    error: `The message is over ${LIMIT} characters.`,
    count: (count: number) => `${count} of ${LIMIT} characters`,
  },
} as const;

/** The TextArea page: one section per option, in a scrollable screen. */
export function TextAreaScreen() {
  const [message, setMessage] = useState("");

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <TextArea label={STRINGS.variants.primary} variant="primary" />
        <Surface variant="secondary">
          <TextArea label={STRINGS.variants.secondary} variant="secondary" />
        </Surface>
      </Section>

      <Section title={STRINGS.parts.title} description={STRINGS.parts.description}>
        <TextArea label={STRINGS.parts.labelOnly} />
        <TextArea label={STRINGS.parts.withPlaceholder} placeholder={STRINGS.parts.placeholder} />
        <TextArea label={STRINGS.parts.withDescription} description={STRINGS.parts.hint} />
      </Section>

      <Section title={STRINGS.lines.title} description={STRINGS.lines.description}>
        <TextArea label={STRINGS.lines.two} rows={2} />
        <TextArea label={STRINGS.lines.six} rows={6} />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <TextArea label={STRINGS.states.required} isRequired />
        <TextArea
          label={STRINGS.states.invalid}
          isInvalid
          errorMessage={STRINGS.states.invalidMessage}
          defaultValue="Too short"
        />
        <TextArea label={STRINGS.states.disabled} isDisabled defaultValue={STRINGS.states.kept} />
        <TextArea label={STRINGS.states.readOnly} isReadOnly defaultValue={STRINGS.states.kept} />
      </Section>

      <Section title={STRINGS.width.title} description={STRINGS.width.description}>
        <TextArea label={STRINGS.width.full} />
        <TextArea label={STRINGS.width.content} isFullWidth={false} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <TextArea
          label={STRINGS.live.label}
          description={STRINGS.live.hint}
          errorMessage={STRINGS.live.error}
          isInvalid={message.length > LIMIT}
          value={message}
          onChange={setMessage}
        />
        <Text tone={message.length > LIMIT ? "danger" : "muted"} accessibilityLiveRegion="polite">
          {STRINGS.live.count(message.length)}
        </Text>
      </Section>
    </Screen>
  );
}
