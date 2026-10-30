/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Number field: Invalid shows the error message, disabled and read-only keep
 *          the value.
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

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Number field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiNumberField
        label={t(K.invalid)}
        defaultValue={0}
        isInvalid
        errorMessage={t(K.invalid_message)}
      />
      <UiNumberField label={t(K.disabled)} defaultValue={2} isDisabled />
      <UiNumberField label={t(K.read_only)} defaultValue={5} isReadOnly />
    </div>
  );
}
