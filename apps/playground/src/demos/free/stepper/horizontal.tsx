/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the web Stepper: a four-step checkout: Back and Next move the current step, and a complete step can be pressed to go back to it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, Stepper, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_KEYS } from "#src/demos/free/stepper/stepper-keys.constant";

/** The demo's keys. */
const K = STEPPER_KEYS.stepper.horizontal;

/** Stepper: a checkout across the top. */
export default function Horizontal() {
  const t = useCatalogueText(MESSAGES.en);
  const steps = [
    { id: "cart", label: t(K.cart) },
    { id: "shipping", label: t(K.shipping) },
    { id: "payment", label: t(K.payment) },
    { id: "review", label: t(K.review) },
  ];
  const [at, setAt] = useState(1);
  const current = steps[at]?.id ?? "cart";
  return (
    <div className="grid w-full max-w-xl gap-6">
      <Stepper
        label={t(K.label)}
        steps={steps}
        currentStep={current}
        onStepPress={(id) => setAt(steps.findIndex((step) => step.id === id))}
      />
      <div className="flex justify-between gap-3">
        <Button variant="secondary" isDisabled={at === 0} onPress={() => setAt(at - 1)}>
          {t(K.back)}
        </Button>
        <Button onPress={() => setAt(Math.min(at + 1, steps.length - 1))}>
          {at === steps.length - 1 ? t(K.place) : t(K.next)}
        </Button>
      </div>
    </div>
  );
}
