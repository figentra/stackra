/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Calendar: pick a delivery day; Fridays and past days are closed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Calendar, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { CalendarDate } from "@internationalized/date";

import { MESSAGES } from "#src/constants/messages.constant";
import { CALENDAR_DEMO_KEYS } from "#src/demos/free/calendar/calendar-demo-keys.constant";

/** The demo's keys. */
const K = CALENDAR_DEMO_KEYS.demo_free.calendar.basics;

/** Calendar: pick a delivery day; Fridays and past days are closed. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Calendar
        label={t(K.label)}
        defaultValue={new CalendarDate(2026, 11, 12)}
        minValue={new CalendarDate(2026, 11, 3)}
        isDateUnavailable={(date) => date.toDate("UTC").getUTCDay() === 5}
      />
    </View>
  );
}
