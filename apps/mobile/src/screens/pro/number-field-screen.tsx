/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `NumberField` (@stackra/ui-pro): a controlled field with a
 *          label, a description and a minimum, then a step with a minimum and a maximum, currency and percent
 *          formats, the invalid state with its message, and the disabled state.
 * Boundary: presentation and local demo state only; the field is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-403 FR-012.
 */
import { NumberField } from "@stackra/ui-pro/native";
import { Description, FieldError, Label, Typography } from "heroui-native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  width: {
    title: "Label and description",
    description:
      "A controlled field with a minimum of 0: the buttons and the keyboard both change it.",
    label: "Width",
    hint: "Enter the width in pixels.",
    value: "Value:",
  },
  step: {
    title: "Step, minimum and maximum",
    description: "Each press moves by 10; the buttons disable themselves at 0 and at 100.",
    label: "Quantity",
  },
  currency: {
    title: "Currency",
    description:
      "`formatOptions` takes `Intl.NumberFormat` options; the value stays a plain number.",
    label: "Unit price",
  },
  percent: {
    title: "Percent",
    description: "With the percent style 0.5 shows as 50%, and a step of 0.01 moves one point.",
    label: "Discount",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` shows the danger border and the message; here it follows the value.",
    label: "Seats",
    hint: "Enter a value between 0 and 100.",
    error: "Seats must be 100 or fewer.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off the input and both buttons.",
    label: "Locked width",
  },
} as const;

/** The NumberField page: one section per format and state, in a scrollable screen. */
export function NumberFieldScreen() {
  const [width, setWidth] = useState(1024);
  const [seats, setSeats] = useState(150);

  return (
    <Screen>
      <Section title={STRINGS.width.title} description={STRINGS.width.description}>
        <NumberField label={STRINGS.width.label} minValue={0} value={width} onChange={setWidth}>
          <Label>{STRINGS.width.label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
          <Description>{STRINGS.width.hint}</Description>
        </NumberField>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.width.value} ${width}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.step.title} description={STRINGS.step.description}>
        <NumberField
          label={STRINGS.step.label}
          defaultValue={0}
          minValue={0}
          maxValue={100}
          step={10}
        >
          <Label>{STRINGS.step.label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </Section>

      <Section title={STRINGS.currency.title} description={STRINGS.currency.description}>
        <NumberField
          label={STRINGS.currency.label}
          defaultValue={99.99}
          minValue={0}
          formatOptions={{ style: "currency", currency: "USD" }}
        >
          <Label>{STRINGS.currency.label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </Section>

      <Section title={STRINGS.percent.title} description={STRINGS.percent.description}>
        <NumberField
          label={STRINGS.percent.label}
          defaultValue={0.5}
          minValue={0}
          maxValue={1}
          step={0.01}
          formatOptions={{ style: "percent" }}
        >
          <Label>{STRINGS.percent.label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <NumberField
          label={STRINGS.invalid.label}
          isRequired
          isInvalid={seats > 100}
          minValue={0}
          value={seats}
          onChange={setSeats}
        >
          <Label>{STRINGS.invalid.label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
          <Description hideOnInvalid>{STRINGS.invalid.hint}</Description>
          <FieldError>{STRINGS.invalid.error}</FieldError>
        </NumberField>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <NumberField label={STRINGS.disabled.label} isDisabled defaultValue={1024} minValue={0}>
          <Label>{STRINGS.disabled.label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </Section>
    </Screen>
  );
}
