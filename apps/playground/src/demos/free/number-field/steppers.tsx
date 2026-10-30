/**
 * Stackra file contract:
 * Purpose: the "steppers" demo of the web Number field: hasSteppers turned off hides the two buttons; the arrow keys
 *          still step the value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0060 (light, dark, RTL).
 */
import { NumberField as UiNumberField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_KEYS } from "#src/demos/free/number-field/number-field-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_KEYS.number_field;

/** Number field: Without buttons. */
export default function Steppers() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiNumberField
      label={t(K.no_steppers)}
      description={t(K.no_steppers_description)}
      defaultValue={3}
      minValue={0}
      hasSteppers={false}
    />
  );
}
