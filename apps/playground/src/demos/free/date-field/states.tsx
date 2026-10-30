/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Date field: Invalid holds a Saturday, which the field refuses through
 *          isDateUnavailable. Read-only and disabled keep the day.
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

/** Saturdays and Sundays are refused: the day of the week in UTC, since a `CalendarDate` has no zone of its own. */
const isWeekend = (date: CalendarDate) => [0, 6].includes(date.toDate("UTC").getUTCDay());

/** Date field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiDateField
        label={t(K.invalid)}
        errorMessage={t(K.invalid_message)}
        defaultValue={new CalendarDate(2026, 3, 7)}
        isDateUnavailable={isWeekend}
        validationBehavior="aria"
      />
      <UiDateField label={t(K.read_only)} defaultValue={new CalendarDate(2026, 2, 12)} isReadOnly />
      <UiDateField label={t(K.disabled)} defaultValue={new CalendarDate(2026, 1, 20)} isDisabled />
    </div>
  );
}
