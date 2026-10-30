/**
 * Stackra file contract:
 * Purpose: the "bounded" demo of the web Date picker: The calendar greys out every day outside the range, and a typed
 *          day outside it is invalid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0318 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { DatePicker as UiDatePicker, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_KEYS } from "#src/demos/free/date-picker/date-picker-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_KEYS.date_picker;

const MARCH_1 = new CalendarDate(2026, 3, 1);

const MARCH_31 = new CalendarDate(2026, 3, 31);

/** Date picker: Bounded. */
export default function Bounded() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiDatePicker
      label={t(K.bounded_label)}
      description={t(K.bounded_description)}
      errorMessage={t(K.bounded_message)}
      calendarButtonLabel={t(K.bounded_button)}
      defaultValue={new CalendarDate(2026, 3, 15)}
      minValue={MARCH_1}
      maxValue={MARCH_31}
      validationBehavior="aria"
    />
  );
}
