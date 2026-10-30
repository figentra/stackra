/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Date field: An empty field and a filled one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { DateField as UiDateField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_FIELD_KEYS } from "#src/demos/free/date-field/date-field-keys.constant";

/** The demo's keys. */
const K = DATE_FIELD_KEYS.date_field;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Date field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiDateField label={t(K.empty)} description={t(K.empty_description)} />
      <UiDateField
        label={t(K.filled)}
        description={t(K.filled_description)}
        defaultValue={new CalendarDate(2026, 3, 5)}
      />
    </div>
  );
}
