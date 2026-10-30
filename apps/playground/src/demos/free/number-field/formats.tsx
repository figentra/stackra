/**
 * Stackra file contract:
 * Purpose: the "formats" demo of the web Number field: formatOptions turns the same number into a percentage or a
 *          price. The value held is the plain number: 0.15 and 1299.5.
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

/** Number field: Formats. */
export default function Formats() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiNumberField
        label={t(K.percent)}
        description={t(K.percent_description)}
        defaultValue={0.15}
        minValue={0}
        maxValue={1}
        step={0.05}
        formatOptions={{ style: "percent" }}
      />
      <UiNumberField
        label={t(K.currency)}
        description={t(K.currency_description)}
        defaultValue={1299.5}
        minValue={0}
        step={0.5}
        formatOptions={{ style: "currency", currency: "USD" }}
      />
    </div>
  );
}
