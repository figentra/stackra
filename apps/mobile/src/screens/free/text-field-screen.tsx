/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `TextField` (@stackra/ui): both variants, each part, each
 *          state, every kind of text with its keyboard, the width, and a live email field that is invalid until it
 *          has an at sign.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { TextFieldType } from "@stackra/ui/contracts";
import { Surface, Text, TextField } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants",
    description:
      "`primary` sits on the page; `secondary` is for a surface that is already tinted, so it is shown on one.",
    primary: "Primary field",
    secondary: "Secondary field",
  },
  parts: {
    title: "Parts",
    description: "Each part appears only when it is given.",
    labelOnly: "Label only",
    withPlaceholder: "With a placeholder",
    placeholder: "Ada Lovelace",
    withDescription: "With a description",
    hint: "As it appears on your invoices.",
  },
  states: {
    title: "States",
    description:
      "Required adds the asterisk, invalid shows the error, disabled and read-only keep the value.",
    required: "Required field",
    invalid: "Invalid field",
    invalidMessage: "Enter a name of at least two letters.",
    disabled: "Disabled field",
    readOnly: "Read-only field",
    kept: "Kept value",
  },
  kinds: {
    title: "Kinds of text",
    description: "`type` sets the keyboard, the masking and the capitalisation on native.",
    label: (kind: string) => `Kind: ${kind}`,
  },
  width: {
    title: "Width",
    description: "`isFullWidth` is the default; turn it off to size to the content.",
    full: "Full width",
    content: "Content width",
  },
  live: {
    title: "Try it",
    description:
      "An email field that is invalid until it has an at sign, with the text typed so far shown beneath it.",
    label: "Work email",
    hint: "We use it to send the invoice.",
    error: "Enter an email address with an at sign.",
    empty: "Nothing typed yet.",
    typed: (text: string) => `You typed ${text.length} characters: ${text}`,
  },
} as const;

/** The TextField page: one section per option, in a scrollable screen. */
export function TextFieldScreen() {
  const [email, setEmail] = useState("");

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <TextField label={STRINGS.variants.primary} variant="primary" />
        <Surface variant="secondary">
          <TextField label={STRINGS.variants.secondary} variant="secondary" />
        </Surface>
      </Section>

      <Section title={STRINGS.parts.title} description={STRINGS.parts.description}>
        <TextField label={STRINGS.parts.labelOnly} />
        <TextField label={STRINGS.parts.withPlaceholder} placeholder={STRINGS.parts.placeholder} />
        <TextField label={STRINGS.parts.withDescription} description={STRINGS.parts.hint} />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <TextField label={STRINGS.states.required} isRequired />
        <TextField
          label={STRINGS.states.invalid}
          isInvalid
          errorMessage={STRINGS.states.invalidMessage}
          defaultValue="A"
        />
        <TextField label={STRINGS.states.disabled} isDisabled defaultValue={STRINGS.states.kept} />
        <TextField label={STRINGS.states.readOnly} isReadOnly defaultValue={STRINGS.states.kept} />
      </Section>

      <Section title={STRINGS.kinds.title} description={STRINGS.kinds.description}>
        {TextFieldType.map((kind) => (
          <TextField key={kind} label={STRINGS.kinds.label(kind)} type={kind} />
        ))}
      </Section>

      <Section title={STRINGS.width.title} description={STRINGS.width.description}>
        <TextField label={STRINGS.width.full} />
        <TextField label={STRINGS.width.content} isFullWidth={false} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <TextField
          label={STRINGS.live.label}
          description={STRINGS.live.hint}
          errorMessage={STRINGS.live.error}
          type="email"
          isInvalid={email.length > 0 && !email.includes("@")}
          value={email}
          onChange={setEmail}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {email.length === 0 ? STRINGS.live.empty : STRINGS.live.typed(email)}
        </Text>
      </Section>
    </Screen>
  );
}
