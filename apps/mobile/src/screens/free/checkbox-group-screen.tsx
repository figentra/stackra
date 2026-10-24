/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `CheckboxGroup` (@stackra/ui): a described group, one group
 *          per state (disabled, one option disabled, read-only, required, invalid), the two variants, and a live
 *          group whose readout lists the checked keys.
 * Boundary: presentation and local demo state only; the group is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { Button, CheckboxGroup, Surface, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "A group",
    description: "A label, a description under it, and a description under one of the options.",
    label: "Notify me by",
    hint: "You can change this at any time.",
  },
  states: {
    title: "States",
    description: "One group per state; each label says what it shows.",
    disabled: "Weekly reports (disabled)",
    optionDisabled: "Export formats (one option disabled)",
    readOnly: "Included in your plan (read-only)",
    required: "Topics",
    invalid: "Delivery days",
    invalidHint: "Pick at least one day.",
    invalidError: "Choose a delivery day to continue.",
  },
  variants: {
    title: "Variants",
    description: "`primary` sits on the page; `secondary` is for a group on a surface.",
    primary: "Primary group",
    secondary: "Secondary group",
  },
  live: {
    title: "Try it",
    description:
      "The readout lists the keys of the checked options, in the order they were checked.",
    label: "Toppings",
    chosen: (keys: string) => `Chosen: ${keys}`,
    none: "none",
    all: "Choose all",
    clear: "Clear",
  },
} as const;

/** The channels of the basic sample, one with a second line. */
const CHANNELS: readonly ChoiceOption[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "Text message", description: "Standard rates apply." },
  { value: "push", label: "Push notification" },
];

/** The export formats, with one refused. */
const FORMATS: readonly ChoiceOption[] = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF", isDisabled: true },
];

/** The weekdays of the invalid sample. */
const DAYS: readonly ChoiceOption[] = [
  { value: "mon", label: "Monday" },
  { value: "wed", label: "Wednesday" },
  { value: "fri", label: "Friday" },
];

/** The toppings of the live sample. */
const TOPPINGS: readonly ChoiceOption[] = [
  { value: "cheese", label: "Cheese" },
  { value: "olives", label: "Olives" },
  { value: "basil", label: "Basil" },
];

/** The CheckboxGroup page: one section per option, in a scrollable screen. */
export function CheckboxGroupScreen() {
  const [chosen, setChosen] = useState<readonly string[]>([]);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <CheckboxGroup
          label={STRINGS.basic.label}
          description={STRINGS.basic.hint}
          options={CHANNELS}
          defaultValue={["email"]}
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <CheckboxGroup
          label={STRINGS.states.disabled}
          options={CHANNELS}
          isDisabled
          defaultValue={["email"]}
        />
        <CheckboxGroup label={STRINGS.states.optionDisabled} options={FORMATS} />
        <CheckboxGroup
          label={STRINGS.states.readOnly}
          options={FORMATS}
          isReadOnly
          defaultValue={["csv"]}
        />
        <CheckboxGroup label={STRINGS.states.required} options={CHANNELS} isRequired />
        <CheckboxGroup
          label={STRINGS.states.invalid}
          description={STRINGS.states.invalidHint}
          errorMessage={STRINGS.states.invalidError}
          options={DAYS}
          isInvalid
        />
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <CheckboxGroup
          label={STRINGS.variants.primary}
          options={DAYS}
          variant="primary"
          defaultValue={["mon"]}
        />
        <Surface variant="secondary">
          <CheckboxGroup
            label={STRINGS.variants.secondary}
            options={DAYS}
            variant="secondary"
            defaultValue={["mon"]}
          />
        </Surface>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <CheckboxGroup
          label={STRINGS.live.label}
          options={TOPPINGS}
          value={chosen}
          onChange={setChosen}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.chosen(chosen.length === 0 ? STRINGS.live.none : chosen.join(", "))}
        </Text>
        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => setChosen(TOPPINGS.map(({ value }) => value))}
          >
            {STRINGS.live.all}
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setChosen([])}>
            {STRINGS.live.clear}
          </Button>
        </View>
      </Section>
    </Screen>
  );
}
