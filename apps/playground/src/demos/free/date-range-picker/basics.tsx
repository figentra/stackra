/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Date range picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { DateRangePicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_RANGE_PICKER_KEYS } from "#src/demos/free/date-range-picker/date-range-picker-keys.constant";

/** The demo's keys. */
const K = DATE_RANGE_PICKER_KEYS.date_range_picker.basics;

/** Date range picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <DateRangePicker
        label={t(K.label)}
        description={t(K.hint)}
        calendarButtonLabel={t(K.button)}
        today={new CalendarDate(2026, 3, 18)}
        defaultValue={{ start: new CalendarDate(2026, 3, 1), end: new CalendarDate(2026, 3, 18) }}
      />
    </div>
  );
}
