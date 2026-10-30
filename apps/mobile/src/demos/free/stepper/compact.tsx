/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the native Stepper: "Step 2 of 4", the step's name and a dot per step, for a narrow space.
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
const K = STEPPER_DEMO_KEYS.demo_free.stepper.compact;

/** The Stepper demo: compact. */
export default function Compact() {
  const t = useCatalogueText(MESSAGES.en);
  const steps = [
    { id: "basics", label: t(K.basics) },
    { id: "pricing", label: t(K.pricing) },
    { id: "stock", label: t(K.stock) },
    { id: "review", label: t(K.review) },
  ];
  const [at, setAt] = useState(1);
  return (
    <View className="gap-4">
      <Stepper
        label={t(K.label)}
        variant="compact"
        steps={steps}
        currentStep={steps[at]?.id ?? ""}
      />
      <View className="flex-row justify-between gap-3">
        <Button size="sm" variant="secondary" isDisabled={at === 0} onPress={() => setAt(at - 1)}>
          {t(K.back)}
        </Button>
        <Button size="sm" isDisabled={at === steps.length - 1} onPress={() => setAt(at + 1)}>
          {t(K.next)}
        </Button>
      </View>
    </View>
  );
}
