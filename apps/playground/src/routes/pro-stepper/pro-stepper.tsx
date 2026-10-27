/**
 * Stackra file contract:
 * Purpose: the page of the Stepper route: `@stackra-pro/ui`'s Stepper as a four-step checkout that moves by pressing a
 *          step or the Back and Next buttons, and as a vertical stepper with descriptions, each naming its step and
 *          position.
 * Boundary: presentation and local state only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Button } from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProStepperRoute } from "#src/routes/pro-stepper/pro-stepper.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-stepper.*` keys.
const STRINGS = {
  documentTitle: `${ProStepperRoute.title} · Stackra Playground`,
  intro:
    "A sequence of steps. Press a step, or use Back and Next, to move; completed steps show a check and fill the line behind them.",
  checkout: "Checkout",
  checkoutSteps: "Checkout steps",
  back: "Back",
  next: "Next",
  position: (step: number, total: number, title: string) => `Step ${step} of ${total}: ${title}`,
  tracking: "Order tracking",
  trackingSteps: "Order progress",
} as const;

const STEPS = ["Cart", "Shipping", "Payment", "Confirmation"] as const;

const TRACKING = [
  { title: "Order placed", description: "Payment verified" },
  { title: "Shipped", description: "Left the warehouse" },
  { title: "Out for delivery", description: "Arriving today" },
] as const;

/** The Stepper page. */
export function ProStepper() {
  const [step, setStep] = useState(1);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProStepperRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="checkout-heading" className="grid max-w-xl gap-4">
        <h2 id="checkout-heading" className="type-h2">
          {STRINGS.checkout}
        </h2>
        <UiPro.Stepper label={STRINGS.checkoutSteps} currentStep={step} onStepChange={setStep}>
          {STEPS.map((title) => (
            <UiPro.Stepper.Step key={title}>
              <UiPro.Stepper.Indicator />
              <UiPro.Stepper.Content>
                <UiPro.Stepper.Title>{title}</UiPro.Stepper.Title>
              </UiPro.Stepper.Content>
              <UiPro.Stepper.Separator />
            </UiPro.Stepper.Step>
          ))}
        </UiPro.Stepper>
        <p role="status">
          <bdi>{STRINGS.position(step + 1, STEPS.length, STEPS[step] ?? "")}</bdi>
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" isDisabled={step === 0} onPress={() => setStep(step - 1)}>
            {STRINGS.back}
          </Button>
          <Button isDisabled={step === STEPS.length - 1} onPress={() => setStep(step + 1)}>
            {STRINGS.next}
          </Button>
        </div>
      </section>
      <section aria-labelledby="tracking-heading" className="grid gap-3">
        <h2 id="tracking-heading" className="type-h2">
          {STRINGS.tracking}
        </h2>
        <UiPro.Stepper label={STRINGS.trackingSteps} orientation="vertical" defaultStep={1}>
          {TRACKING.map((item) => (
            <UiPro.Stepper.Step key={item.title}>
              <UiPro.Stepper.Indicator />
              <UiPro.Stepper.Content>
                <UiPro.Stepper.Title>{item.title}</UiPro.Stepper.Title>
                <UiPro.Stepper.Description>{item.description}</UiPro.Stepper.Description>
              </UiPro.Stepper.Content>
              <UiPro.Stepper.Separator />
            </UiPro.Stepper.Step>
          ))}
        </UiPro.Stepper>
      </section>
    </article>
  );
}
