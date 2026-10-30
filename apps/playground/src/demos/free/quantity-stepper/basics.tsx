/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Quantity stepper: a cart line whose minus removes it at one, with a way to put it back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { Button, QuantityStepper, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { QUANTITY_STEPPER_KEYS } from "#src/demos/free/quantity-stepper/quantity-stepper-keys.constant";

/** The demo's keys. */
const K = QUANTITY_STEPPER_KEYS.quantity_stepper;

/** Quantity stepper: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(1);
  const [isRemoved, setRemoved] = useState(false);
  if (isRemoved) {
    return (
      <div className="flex items-center gap-3">
        <Text tone="muted">{t(K.removed)}</Text>
        <Button variant="ghost" onPress={() => setRemoved(false)}>
          {t(K.undo)}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex w-72 items-center justify-between gap-3">
      <Text className="font-medium">{t(K.item)}</Text>
      <QuantityStepper
        label={t(K.qty)}
        minValue={1}
        maxValue={9}
        value={count}
        onChange={setCount}
        onRemove={() => setRemoved(true)}
      />
    </div>
  );
}
