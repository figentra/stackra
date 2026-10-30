/**
 * Stackra file contract:
 * Purpose: the "directional-motion" demo of the web Bidi: checkout steps that slide toward the inline end and a
 *          chevron that points forward, both read from `useDirection`, so Arabic slides and points the other way.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The slide is a CSS transition, off under reduced motion.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Button, Icon, Text, useCatalogueText, useDirection } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BIDI_KEYS } from "#src/demos/free/bidi/bidi-keys.constant";

/** The demo's keys. */
const K = BIDI_KEYS.bidi;

/** The checkout steps, in order. */
const STEPS = [K.cart, K.payment, K.receipt] as const;

/** Bidi: Directional motion. */
export default function DirectionalMotion() {
  const t = useCatalogueText(MESSAGES.en);
  const sign = useDirection() === "rtl" ? 1 : -1;
  const [step, setStep] = useState(0);
  return (
    <div className="grid max-w-sm gap-3">
      <div className="overflow-hidden border border-separator" aria-label={t(K.steps)} role="group">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${sign * step * 100}%)` }}
        >
          {STEPS.map((key, index) => (
            <div key={key} className="w-full shrink-0 p-6 text-center" aria-hidden={index !== step}>
              <Text>{t(key)}</Text>
            </div>
          ))}
        </div>
      </div>
      <Text role="status" tone="muted">
        {t(K.step_of, { step: step + 1, total: STEPS.length })}
      </Text>
      <div className="flex gap-2">
        <Button variant="secondary" isDisabled={step === 0} onPress={() => setStep(step - 1)}>
          <Icon name="chevron-left" isMirroredInRtl />
          {t(K.back)}
        </Button>
        <Button isDisabled={step === STEPS.length - 1} onPress={() => setStep(step + 1)}>
          {t(K.next)}
          <Icon name="chevron-right" isMirroredInRtl />
        </Button>
      </div>
    </div>
  );
}
