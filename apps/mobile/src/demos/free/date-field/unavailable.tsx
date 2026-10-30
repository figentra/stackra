/**
 * Stackra file contract:
 * Purpose: the "unavailable" demo of the native DateField: `isDateUnavailable` refuses weekends with a message.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { isWeekend, type CalendarDate } from "@internationalized/date";
import { DateField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_FIELD_DEMO_KEYS } from "#src/demos/free/date-field/date-field-demo-keys.constant";

/** The demo's keys. */
const K = DATE_FIELD_DEMO_KEYS.demo_free.date_field.unavailable;

/** True for a refused day: Saturdays and Sundays. */
const isClosed = (day: CalendarDate) => isWeekend(day, "en-US");

/** The picker cannot grey out single days, so picking one is refused with a message. */
export default function Unavailable() {
  const t = useCatalogueText(MESSAGES.en);
  return <DateField label={t(K.label)} description={t(K.hint)} isDateUnavailable={isClosed} />;
}
