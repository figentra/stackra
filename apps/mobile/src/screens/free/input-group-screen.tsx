/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `InputGroup` (@stackra/ui): both variants, text prefixes and
 *          suffixes, an icon prefix and a reveal button suffix, each state, the width, and a live slug field.
 * Boundary: presentation and local demo state only; the group is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Button, Icon, InputGroup, Surface, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants",
    description:
      "`primary` sits on the page; `secondary` is for a surface that is already tinted, so it is shown on one.",
    primary: "Primary group",
    secondary: "Secondary group",
  },
  affixes: {
    title: "Prefix and suffix",
    description: "Text affixes are muted and ignore touches, so a press on one reaches the input.",
    prefixOnly: "Prefix only",
    suffixOnly: "Suffix only",
    both: "Prefix and suffix",
  },
  elements: {
    title: "Element affixes",
    description: "An icon before the value, and a button after it that reveals a password.",
    profile: "Profile name",
    password: "Password",
    show: "Show",
    hide: "Hide",
    showLabel: "Show password",
    hideLabel: "Hide password",
  },
  states: {
    title: "States",
    description:
      "Required adds the asterisk, invalid shows the error, disabled and read-only keep the value.",
    required: "Required group",
    invalid: "Invalid group",
    invalidMessage: "Enter a weight in kilograms.",
    disabled: "Disabled group",
    readOnly: "Read-only group",
  },
  width: {
    title: "Width",
    description: "`isFullWidth` is the default; turn it off to size to the content.",
    full: "Full width group",
    content: "Content width group",
  },
  live: {
    title: "Try it",
    description: "A page address: the preview follows the slug as it is typed.",
    label: "Page address",
    hint: "Lower case letters, digits and hyphens.",
    preview: (slug: string) => `https://figentra.com/${slug}`,
  },
} as const;

/** The InputGroup page: one section per option, in a scrollable screen. */
export function InputGroupScreen() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [slug, setSlug] = useState("pricing");

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <InputGroup label={STRINGS.variants.primary} prefix="$" suffix="USD" variant="primary" />
        <Surface variant="secondary">
          <InputGroup
            label={STRINGS.variants.secondary}
            prefix="$"
            suffix="USD"
            variant="secondary"
          />
        </Surface>
      </Section>

      <Section title={STRINGS.affixes.title} description={STRINGS.affixes.description}>
        <InputGroup label={STRINGS.affixes.prefixOnly} prefix="/" defaultValue="about-us" />
        <InputGroup label={STRINGS.affixes.suffixOnly} suffix="kg" defaultValue="12" />
        <InputGroup label={STRINGS.affixes.both} prefix="€" suffix="EUR" defaultValue="49.00" />
      </Section>

      <Section title={STRINGS.elements.title} description={STRINGS.elements.description}>
        <InputGroup
          label={STRINGS.elements.profile}
          prefix={<Icon name="user-round" size="sm" tone="muted" />}
        />
        <InputGroup
          label={STRINGS.elements.password}
          type="password"
          secureTextEntry={!isRevealed}
          suffix={
            <Button
              size="sm"
              variant="ghost"
              label={isRevealed ? STRINGS.elements.hideLabel : STRINGS.elements.showLabel}
              onPress={() => setIsRevealed((value) => !value)}
            >
              {isRevealed ? STRINGS.elements.hide : STRINGS.elements.show}
            </Button>
          }
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <InputGroup label={STRINGS.states.required} suffix="kg" isRequired />
        <InputGroup
          label={STRINGS.states.invalid}
          suffix="kg"
          isInvalid
          errorMessage={STRINGS.states.invalidMessage}
          defaultValue="heavy"
        />
        <InputGroup label={STRINGS.states.disabled} suffix="kg" isDisabled defaultValue="12" />
        <InputGroup label={STRINGS.states.readOnly} suffix="kg" isReadOnly defaultValue="12" />
      </Section>

      <Section title={STRINGS.width.title} description={STRINGS.width.description}>
        <InputGroup label={STRINGS.width.full} prefix="#" />
        <InputGroup label={STRINGS.width.content} prefix="#" isFullWidth={false} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <InputGroup
          label={STRINGS.live.label}
          description={STRINGS.live.hint}
          prefix="/"
          type="url"
          value={slug}
          onChange={setSlug}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.preview(slug)}
        </Text>
      </Section>
    </Screen>
  );
}
