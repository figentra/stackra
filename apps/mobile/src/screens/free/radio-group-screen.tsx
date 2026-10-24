/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `RadioGroup` (@stackra/ui): the vertical and horizontal
 *          layouts, one group per state (disabled, one option disabled, read-only, required, invalid), the two
 *          variants, and a live group chosen from inside and from outside.
 * Boundary: presentation and local demo state only; the group is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { Button, RadioGroup, Surface, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  layouts: {
    title: "Layouts",
    description:
      '`orientation`: vertical by default, with a description under an option; `"horizontal"` puts the options in a row.',
    vertical: "Shipping speed",
    verticalHint: "Prices include tax.",
    horizontal: "Size",
  },
  states: {
    title: "States",
    description: "One group per state; each label says what it shows.",
    disabled: "Billing cycle (disabled)",
    optionDisabled: "Payment method (one option disabled)",
    readOnly: "Your plan (read-only)",
    required: "Account type",
    invalid: "Delivery window",
    invalidHint: "Pick the time that suits you.",
    invalidError: "Choose a delivery window to continue.",
  },
  variants: {
    title: "Variants",
    description: "`primary` sits on the page; `secondary` is for a group on a surface.",
    primary: "Primary group",
    secondary: "Secondary group",
  },
  live: {
    title: "Try it",
    description: "The readout shows the chosen key; the buttons choose from outside the group.",
    label: "Fruit",
    chosen: (key: string) => `Chosen: ${key}`,
    pickApple: "Choose apple",
    pickPear: "Choose pear",
  },
} as const;

/** The shipping speeds, one with a second line. */
const SPEEDS: readonly ChoiceOption[] = [
  { value: "standard", label: "Standard", description: "Three to five working days." },
  { value: "express", label: "Express" },
  { value: "overnight", label: "Overnight" },
];

/** The sizes of the horizontal sample. */
const SIZES: readonly ChoiceOption[] = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
];

/** The payment methods, with one refused. */
const METHODS: readonly ChoiceOption[] = [
  { value: "card", label: "Card" },
  { value: "transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash", isDisabled: true },
];

/** The fruits of the live sample. */
const FRUITS: readonly ChoiceOption[] = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
  { value: "plum", label: "Plum" },
];

/** The RadioGroup page: one section per option, in a scrollable screen. */
export function RadioGroupScreen() {
  const [fruit, setFruit] = useState("apple");

  return (
    <Screen>
      <Section title={STRINGS.layouts.title} description={STRINGS.layouts.description}>
        <RadioGroup
          label={STRINGS.layouts.vertical}
          description={STRINGS.layouts.verticalHint}
          options={SPEEDS}
          defaultValue="standard"
        />
        <RadioGroup
          label={STRINGS.layouts.horizontal}
          options={SIZES}
          orientation="horizontal"
          defaultValue="m"
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <RadioGroup label={STRINGS.states.disabled} options={SIZES} isDisabled defaultValue="m" />
        <RadioGroup label={STRINGS.states.optionDisabled} options={METHODS} defaultValue="card" />
        <RadioGroup label={STRINGS.states.readOnly} options={SIZES} isReadOnly defaultValue="l" />
        <RadioGroup label={STRINGS.states.required} options={METHODS} isRequired />
        <RadioGroup
          label={STRINGS.states.invalid}
          description={STRINGS.states.invalidHint}
          errorMessage={STRINGS.states.invalidError}
          options={SPEEDS}
          isInvalid
        />
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <RadioGroup
          label={STRINGS.variants.primary}
          options={SIZES}
          variant="primary"
          defaultValue="s"
        />
        <Surface variant="secondary">
          <RadioGroup
            label={STRINGS.variants.secondary}
            options={SIZES}
            variant="secondary"
            defaultValue="s"
          />
        </Surface>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <RadioGroup label={STRINGS.live.label} options={FRUITS} value={fruit} onChange={setFruit} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.chosen(fruit)}
        </Text>
        <View className="flex-row gap-2">
          <Button size="sm" variant="secondary" onPress={() => setFruit("apple")}>
            {STRINGS.live.pickApple}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setFruit("pear")}>
            {STRINGS.live.pickPear}
          </Button>
        </View>
      </Section>
    </Screen>
  );
}
