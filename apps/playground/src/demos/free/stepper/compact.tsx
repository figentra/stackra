/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the web Stepper: "Step 2 of 4", the step's name and a dot per step, for a narrow space.
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
const K = STEPPER_KEYS.stepper.compact;

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
    <div className="grid w-full max-w-xs gap-4">
      <Stepper
        label={t(K.label)}
        variant="compact"
        steps={steps}
        currentStep={steps[at]?.id ?? ""}
      />
      <div className="flex justify-between gap-3">
        <Button size="sm" variant="secondary" isDisabled={at === 0} onPress={() => setAt(at - 1)}>
          {t(K.back)}
        </Button>
        <Button size="sm" isDisabled={at === steps.length - 1} onPress={() => setAt(at + 1)}>
          {t(K.next)}
        </Button>
      </div>
    </div>
  );
}
