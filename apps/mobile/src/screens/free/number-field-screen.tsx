/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `NumberField` (@stackra/ui): a labelled field with steppers,
 *          one bounded between two values, a percentage, an amount of money, a field without steppers, each state
 *          (required, invalid, disabled, read-only), and a live field whose value, or its absence, is read out.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand. The
 *          number is written and read in the locale of the design-system provider.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Button, NumberField, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A visible label with a placeholder, and a label with a description.",
    quantity: "Quantity",
    placeholder: "How many?",
    weight: "Weight",
    hint: "In kilograms, up to two decimals.",
  },
  bounded: {
    title: "Bounded",
    description:
      "`minValue`, `maxValue` and `step`: a typed or stepped number is held to the bounds, and a stepper stops at one.",
    label: "Seats",
    hint: "Between 1 and 10.",
    increment: "Add one seat",
    decrement: "Remove one seat",
  },
  formats: {
    title: "Percent and currency",
    description:
      "`formatOptions` are `Intl` options: a percentage is held as a fraction and steps by one point, money shows its symbol.",
    percent: "Discount",
    percentHint: "Held as a fraction: 25 percent is 0.25.",
    currency: "Price",
    currencyHint: "In US dollars.",
  },
  steppers: {
    title: "No steppers",
    description: "`hasSteppers` off hides the two buttons and keeps the number pad.",
    label: "Postal code length",
  },
  states: {
    title: "States",
    description:
      "Each state of the field. Disabled and read-only keep their value; read-only is not announced as disabled.",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Enter a quantity of at least 1.",
    disabled: "Disabled",
    readOnly: "Read-only",
  },
  live: {
    title: "Try it",
    description:
      "Type a number or press a stepper; the readout shows the value, and `null` once the field is emptied.",
    label: "Tickets",
    value: (value: number | null) => `Value: ${value === null ? "none" : value}`,
    clear: "Clear the field",
    set: "Set it to 4",
  },
} as const;

/** The NumberField page: one section per option, in a scrollable screen. */
export function NumberFieldScreen() {
  const [value, setValue] = useState<number | null>(2);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <NumberField label={STRINGS.basics.quantity} placeholder={STRINGS.basics.placeholder} />
        <NumberField
          label={STRINGS.basics.weight}
          description={STRINGS.basics.hint}
          defaultValue={2.5}
          step={0.25}
          minValue={0}
        />
      </Section>

      <Section title={STRINGS.bounded.title} description={STRINGS.bounded.description}>
        <NumberField
          label={STRINGS.bounded.label}
          description={STRINGS.bounded.hint}
          defaultValue={3}
          minValue={1}
          maxValue={10}
          incrementLabel={STRINGS.bounded.increment}
          decrementLabel={STRINGS.bounded.decrement}
        />
      </Section>

      <Section title={STRINGS.formats.title} description={STRINGS.formats.description}>
        <NumberField
          label={STRINGS.formats.percent}
          description={STRINGS.formats.percentHint}
          defaultValue={0.25}
          minValue={0}
          maxValue={1}
          formatOptions={{ style: "percent" }}
        />
        <NumberField
          label={STRINGS.formats.currency}
          description={STRINGS.formats.currencyHint}
          defaultValue={19.99}
          minValue={0}
          formatOptions={{ style: "currency", currency: "USD" }}
        />
      </Section>

      <Section title={STRINGS.steppers.title} description={STRINGS.steppers.description}>
        <NumberField label={STRINGS.steppers.label} defaultValue={5} hasSteppers={false} />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <NumberField label={STRINGS.states.required} isRequired />
        <NumberField
          label={STRINGS.states.invalid}
          isInvalid
          defaultValue={0}
          errorMessage={STRINGS.states.invalidError}
        />
        <NumberField label={STRINGS.states.disabled} isDisabled defaultValue={7} />
        <NumberField label={STRINGS.states.readOnly} isReadOnly defaultValue={7} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <NumberField label={STRINGS.live.label} value={value} onChange={setValue} minValue={0} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.value(value)}
        </Text>
        <Button size="sm" variant="secondary" onPress={() => setValue(4)}>
          {STRINGS.live.set}
        </Button>
        <Button size="sm" variant="tertiary" onPress={() => setValue(null)}>
          {STRINGS.live.clear}
        </Button>
      </Section>
    </Screen>
  );
}
