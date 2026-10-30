/**
 * Stackra file contract:
 * Purpose: the "bounded" demo of the native NumberField: `minValue`, `maxValue` and `step` hold the number.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_DEMO_KEYS } from "#src/demos/free/number-field/number-field-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_DEMO_KEYS.demo_free.number_field.bounded;

/** A stepper stops at a bound. */
export default function Bounded() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <NumberField
      label={t(K.label)}
      description={t(K.hint)}
      defaultValue={3}
      minValue={1}
      maxValue={10}
      incrementLabel={t(K.increment)}
      decrementLabel={t(K.decrement)}
    />
  );
}
