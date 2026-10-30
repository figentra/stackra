/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Date and time picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CalendarDateTime } from "@internationalized/date";
import { DateTimePicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_TIME_PICKER_KEYS } from "#src/demos/free/date-time-picker/date-time-picker-keys.constant";

/** The demo's keys. */
const K = DATE_TIME_PICKER_KEYS.date_time_picker.basics;

/** Date and time picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <DateTimePicker
        label={t(K.label)}
        description={t(K.hint)}
        calendarButtonLabel={t(K.button)}
        defaultValue={new CalendarDateTime(2026, 3, 18, 16, 30)}
      />
    </div>
  );
}
