/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Stepper` (@stackra/ui-pro): a vertical stepper whose active
 *          step is controlled from previous and next buttons, a horizontal stepper that reads its steps as titles,
 *          and a stepper with its animations off.
 * Boundary: presentation and local demo state only; the stepper is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Button, Text } from "@stackra/ui/native";
import { Stepper } from "@stackra/ui-pro/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  vertical: {
    title: "Vertical and controlled",
    description:
      "Steps before the current one are complete; tap a step or use the buttons to move.",
    name: "Sign-up progress",
    previous: "Previous step",
    next: "Next step",
    position: "Step",
    of: "of",
  },
  horizontal: {
    title: "Horizontal",
    description: '`orientation="horizontal"` lays the steps in a row, here with titles only.',
    name: "Checkout progress",
  },
  still: {
    title: "No animation",
    description: '`animation="disable-all"` draws every state without motion.',
    name: "Order progress",
  },
  steps: {
    account: { title: "Account", description: "Create your account" },
    profile: { title: "Profile", description: "Set up your profile" },
    settings: { title: "Settings", description: "Configure preferences" },
    review: { title: "Review", description: "Review and confirm" },
  },
  checkout: { cart: "Cart", shipping: "Shipping", payment: "Payment" },
} as const;

const STEPS = [
  STRINGS.steps.account,
  STRINGS.steps.profile,
  STRINGS.steps.settings,
  STRINGS.steps.review,
] as const;

const CHECKOUT_STEPS = [
  STRINGS.checkout.cart,
  STRINGS.checkout.shipping,
  STRINGS.checkout.payment,
] as const;

/** The Stepper page: one section per orientation and state, in a scrollable screen. */
export function StepperScreen() {
  const [step, setStep] = useState(1);

  return (
    <Screen>
      <Section title={STRINGS.vertical.title} description={STRINGS.vertical.description}>
        <Stepper
          label={STRINGS.vertical.name}
          orientation="vertical"
          currentStep={step}
          onStepChange={setStep}
        >
          {STEPS.map((item) => (
            <Stepper.Step key={item.title}>
              <Stepper.Rail />
              <Stepper.Content>
                <Stepper.Title>{item.title}</Stepper.Title>
                <Stepper.Description>{item.description}</Stepper.Description>
              </Stepper.Content>
            </Stepper.Step>
          ))}
        </Stepper>
        <View className="flex-row items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            label={STRINGS.vertical.previous}
            isDisabled={step <= 0}
            onPress={() => setStep((current) => Math.max(0, current - 1))}
          >
            {STRINGS.vertical.previous}
          </Button>
          <Text type="small" tone="muted" accessibilityLiveRegion="polite">
            {`${STRINGS.vertical.position} ${step + 1} ${STRINGS.vertical.of} ${STEPS.length}`}
          </Text>
          <Button
            size="sm"
            variant="outline"
            label={STRINGS.vertical.next}
            isDisabled={step >= STEPS.length - 1}
            onPress={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
          >
            {STRINGS.vertical.next}
          </Button>
        </View>
      </Section>

      <Section title={STRINGS.horizontal.title} description={STRINGS.horizontal.description}>
        <Stepper label={STRINGS.horizontal.name} orientation="horizontal" currentStep={1}>
          {CHECKOUT_STEPS.map((title) => (
            <Stepper.Step key={title}>
              <Stepper.Rail />
              <Stepper.Content>
                <Stepper.Title>{title}</Stepper.Title>
              </Stepper.Content>
            </Stepper.Step>
          ))}
        </Stepper>
      </Section>

      <Section title={STRINGS.still.title} description={STRINGS.still.description}>
        <Stepper label={STRINGS.still.name} animation="disable-all" currentStep={2}>
          {STEPS.slice(0, 3).map((item) => (
            <Stepper.Step key={item.title}>
              <Stepper.Rail />
              <Stepper.Content>
                <Stepper.Title>{item.title}</Stepper.Title>
                <Stepper.Description>{item.description}</Stepper.Description>
              </Stepper.Content>
            </Stepper.Step>
          ))}
        </Stepper>
      </Section>
    </Screen>
  );
}
