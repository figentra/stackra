/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the native Calendar: the same grid in the Umm al-Qura calendar; the value stays Gregorian.
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
const K = CALENDAR_DEMO_KEYS.demo_free.calendar.hijri;

/** Calendar: the same grid in the Umm al-Qura calendar; the value stays Gregorian. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Calendar
        label={t(K.label)}
        calendar="islamic-umalqura"
        defaultValue={new CalendarDate(2026, 11, 12)}
      />
    </View>
  );
}
