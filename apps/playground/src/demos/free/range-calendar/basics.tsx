/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Range calendar: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import type { DateRangeValue } from "@stackra/ui/contracts";
import { CalendarDate } from "@internationalized/date";
import { RangeCalendar, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { RANGE_CALENDAR_KEYS } from "#src/demos/free/range-calendar/range-calendar-keys.constant";

/** The demo's keys. */
const K = RANGE_CALENDAR_KEYS.range_calendar.basics;

/** Range calendar: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [range, setRange] = useState<DateRangeValue>({
    start: new CalendarDate(2026, 3, 10),
    end: new CalendarDate(2026, 3, 14),
  });
  return (
    <div className="grid gap-4">
      <RangeCalendar label={t(K.label)} value={range} onChange={setRange} />
      <Text tone="muted">
        {t(K.chosen, { start: range.start?.toString() ?? "", end: range.end?.toString() ?? "" })}
      </Text>
    </div>
  );
}
