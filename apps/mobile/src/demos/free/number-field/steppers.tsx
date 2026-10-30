/**
 * Stackra file contract:
 * Purpose: the "steppers" demo of the native NumberField: `hasSteppers` off hides the buttons, keeps the number pad.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_DEMO_KEYS } from "#src/demos/free/number-field/number-field-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_DEMO_KEYS.demo_free.number_field.steppers;

/** No steppers. */
export default function Steppers() {
  const t = useCatalogueText(MESSAGES.en);
  return <NumberField label={t(K.label)} defaultValue={5} hasSteppers={false} />;
}
