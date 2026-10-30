/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the native Stepper: a four-step checkout: Back and Next move the current step, and a complete step can be pressed to go back to it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (owner request 2026-10-29).
 */
import { Button, Stepper, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_DEMO_KEYS } from "#src/demos/free/stepper/stepper-demo-keys.constant";

/** The demo's keys. */
const K = STEPPER_DEMO_KEYS.demo_free.stepper.horizontal;

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
  return (
    <View className="gap-6">
      <Stepper
        label={t(K.label)}
        steps={steps}
        currentStep={steps[at]?.id ?? "cart"}
        onStepPress={(id) => setAt(steps.findIndex((step) => step.id === id))}
      />
      <View className="flex-row justify-between gap-3">
        <Button variant="secondary" isDisabled={at === 0} onPress={() => setAt(at - 1)}>
          {t(K.back)}
        </Button>
        <Button onPress={() => setAt(Math.min(at + 1, steps.length - 1))}>
          {at === steps.length - 1 ? t(K.place) : t(K.next)}
        </Button>
      </View>
    </View>
  );
}
