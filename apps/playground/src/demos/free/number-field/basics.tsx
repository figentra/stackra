/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Number field: A plain field and one with bounds. The buttons stop at the ends
 *          of the range.
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

/** Number field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiNumberField label={t(K.plain)} description={t(K.plain_description)} defaultValue={2} />
      <UiNumberField
        label={t(K.bounded)}
        description={t(K.bounded_description)}
        defaultValue={4}
        minValue={1}
        maxValue={10}
      />
    </div>
  );
}
