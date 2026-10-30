/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the native Range calendar: Hijri calendar.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { RangeCalendar, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RANGE_CALENDAR_DEMO_KEYS } from "#src/demos/free/range-calendar/range-calendar-demo-keys.constant";

/** The demo's keys. */
const K = RANGE_CALENDAR_DEMO_KEYS.demo_free.range_calendar.hijri;

/** Range calendar: Hijri calendar. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <RangeCalendar
        label={t(K.label)}
        calendar="islamic-umalqura"
        defaultValue={{ start: new CalendarDate(2026, 3, 18), end: new CalendarDate(2026, 3, 22) }}
      />
    </View>
  );
}
