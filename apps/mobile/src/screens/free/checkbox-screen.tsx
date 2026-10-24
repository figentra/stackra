/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Checkbox` (@stackra/ui): one checkbox per state (unchecked,
 *          checked, indeterminate, disabled, read-only, required, described, invalid), the two variants, one without
 *          a visible label, and a live parent that is indeterminate while some of its children are checked.
 * Boundary: presentation and local demo state only; the checkbox is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Button, Checkbox, Surface, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  states: {
    title: "States",
    description: "One checkbox per state; each label says what it shows.",
    unchecked: "Subscribe to the newsletter",
    checked: "Remember this device",
    indeterminate: "Select every invoice (indeterminate)",
    disabled: "Share usage data (disabled)",
    disabledChecked: "Use the company sign-in (disabled, checked)",
    readOnly: "Your plan includes backups (read-only)",
    required: "I accept the terms",
    described: "Send me product updates",
    descriptionText: "At most one email a month.",
    invalid: "I am over eighteen",
    errorText: "Confirm your age to continue.",
  },
  variants: {
    title: "Variants",
    description: "`primary` sits on the page; `secondary` is for a checkbox on a surface.",
    primary: "Primary variant",
    secondary: "Secondary variant",
  },
  unnamed: {
    title: "Without a visible label",
    description:
      "A checkbox with no label takes an accessible name instead, as a table's row selector does.",
    rowSelector: "Select row 3",
  },
  live: {
    title: "Try it",
    description:
      "The parent shows a dash while some children are checked, checks all of them when pressed, and clears them when all are checked.",
    parent: "Select all toppings",
    chosen: (names: string) => `Chosen: ${names}`,
    none: "none",
    clear: "Clear",
  },
} as const;

/** The children of the live sample. */
const TOPPINGS = ["Cheese", "Olives", "Basil"] as const;

/** The Checkbox page: one section per option, in a scrollable screen. */
export function CheckboxScreen() {
  const [chosen, setChosen] = useState<readonly string[]>(["Cheese"]);
  const isAll = chosen.length === TOPPINGS.length;
  const isSome = chosen.length > 0 && !isAll;
  const toggle = (name: string, isChecked: boolean) =>
    setChosen((list) => (isChecked ? [...list, name] : list.filter((item) => item !== name)));

  return (
    <Screen>
      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Checkbox label={STRINGS.states.unchecked} />
        <Checkbox label={STRINGS.states.checked} defaultValue />
        <Checkbox label={STRINGS.states.indeterminate} isIndeterminate />
        <Checkbox label={STRINGS.states.disabled} isDisabled />
        <Checkbox label={STRINGS.states.disabledChecked} isDisabled defaultValue />
        <Checkbox label={STRINGS.states.readOnly} isReadOnly defaultValue />
        <Checkbox label={STRINGS.states.required} isRequired />
        <Checkbox label={STRINGS.states.described} description={STRINGS.states.descriptionText} />
        <Checkbox
          label={STRINGS.states.invalid}
          isInvalid
          errorMessage={STRINGS.states.errorText}
        />
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <Checkbox label={STRINGS.variants.primary} variant="primary" defaultValue />
        <Surface variant="secondary">
          <Checkbox label={STRINGS.variants.secondary} variant="secondary" defaultValue />
        </Surface>
      </Section>

      <Section title={STRINGS.unnamed.title} description={STRINGS.unnamed.description}>
        <Checkbox accessibilityLabel={STRINGS.unnamed.rowSelector} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Checkbox
          label={STRINGS.live.parent}
          value={isAll}
          isIndeterminate={isSome}
          onChange={() => setChosen(isAll ? [] : [...TOPPINGS])}
        />
        <View className="gap-2 ps-8">
          {TOPPINGS.map((name) => (
            <Checkbox
              key={name}
              label={name}
              value={chosen.includes(name)}
              onChange={(isChecked) => toggle(name, isChecked)}
            />
          ))}
        </View>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.chosen(chosen.length === 0 ? STRINGS.live.none : chosen.join(", "))}
        </Text>
        <Button size="sm" variant="tertiary" onPress={() => setChosen([])}>
          {STRINGS.live.clear}
        </Button>
      </Section>
    </Screen>
  );
}
