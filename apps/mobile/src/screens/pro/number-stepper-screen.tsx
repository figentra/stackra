/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `NumberStepper` (@stackra/ui-pro): a controlled stepper with
 *          the value read back, one with a step, a minimum and a maximum, one with a fractional step, a stepper whose
 *          minus button stays active at the minimum, and the disabled state.
 * Boundary: presentation and local demo state only; the stepper is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { NumberStepper } from "@stackra/ui-pro/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description:
      "The plus and minus buttons change the value; the value flips in the direction of the change.",
    name: "Quantity",
    value: "Quantity:",
  },
  step: {
    title: "Step, minimum and maximum",
    description: "Each press moves by 5; the buttons disable themselves at 0 and at 100.",
    name: "Seats",
  },
  fraction: {
    title: "Fractional step",
    description: "A step of 0.5 between 0 and 5, for ratings or hours.",
    name: "Hours",
  },
  boundary: {
    title: "Active at the minimum",
    description:
      "`keepActiveAtBoundary` keeps minus pressable at 1, so the page can ask whether to remove the item.",
    name: "Cart quantity",
    note: "Minus was pressed at the minimum:",
    yes: "yes",
    no: "no",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off both buttons.",
    name: "Locked quantity",
  },
  decrease: "Decrease",
  increase: "Increase",
} as const;

/** The NumberStepper page: one section per option and state, in a scrollable screen. */
export function NumberStepperScreen() {
  const [quantity, setQuantity] = useState(5);
  const [isRemoveAsked, setIsRemoveAsked] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <NumberStepper
          label={STRINGS.controlled.name}
          value={quantity}
          onValueChange={setQuantity}
          minValue={0}
          maxValue={20}
        >
          <NumberStepper.DecrementButton accessibilityLabel={STRINGS.decrease} />
          <NumberStepper.Value />
          <NumberStepper.IncrementButton accessibilityLabel={STRINGS.increase} />
        </NumberStepper>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${quantity}`}
        </Text>
      </Section>

      <Section title={STRINGS.step.title} description={STRINGS.step.description}>
        <NumberStepper
          label={STRINGS.step.name}
          defaultValue={0}
          step={5}
          minValue={0}
          maxValue={100}
        >
          <NumberStepper.DecrementButton accessibilityLabel={STRINGS.decrease} />
          <NumberStepper.Value />
          <NumberStepper.IncrementButton accessibilityLabel={STRINGS.increase} />
        </NumberStepper>
      </Section>

      <Section title={STRINGS.fraction.title} description={STRINGS.fraction.description}>
        <NumberStepper
          label={STRINGS.fraction.name}
          defaultValue={1.5}
          step={0.5}
          minValue={0}
          maxValue={5}
        >
          <NumberStepper.DecrementButton accessibilityLabel={STRINGS.decrease} />
          <NumberStepper.Value />
          <NumberStepper.IncrementButton accessibilityLabel={STRINGS.increase} />
        </NumberStepper>
      </Section>

      <Section title={STRINGS.boundary.title} description={STRINGS.boundary.description}>
        <NumberStepper label={STRINGS.boundary.name} defaultValue={2} minValue={1} maxValue={99}>
          {({ isAtMin }) => (
            <>
              <NumberStepper.DecrementButton
                accessibilityLabel={STRINGS.decrease}
                keepActiveAtBoundary
                onPress={() => setIsRemoveAsked(isAtMin)}
              />
              <NumberStepper.Value />
              <NumberStepper.IncrementButton accessibilityLabel={STRINGS.increase} />
            </>
          )}
        </NumberStepper>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.boundary.note} ${isRemoveAsked ? STRINGS.boundary.yes : STRINGS.boundary.no}`}
        </Text>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <NumberStepper label={STRINGS.disabled.name} defaultValue={3} isDisabled>
          <NumberStepper.DecrementButton accessibilityLabel={STRINGS.decrease} />
          <NumberStepper.Value />
          <NumberStepper.IncrementButton accessibilityLabel={STRINGS.increase} />
        </NumberStepper>
      </Section>
    </Screen>
  );
}
