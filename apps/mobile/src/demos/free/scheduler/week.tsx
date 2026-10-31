/**
 * Stackra file contract:
 * Purpose: the "week" demo of the native Scheduler: a clinic's week from 8 to 18, with overlapping bookings side by side and an all-day holiday.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { getLocalTimeZone, startOfWeek, today } from "@internationalized/date";
import { Scheduler, useCatalogueText, type SchedulerEvent } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULER_DEMO_KEYS } from "#src/demos/free/scheduler/scheduler-demo-keys.constant";

/** The demo's keys. */
const K = SCHEDULER_DEMO_KEYS.demo_free.scheduler;

/** This week's Sunday, in the device's time zone. */
const SUNDAY = startOfWeek(today(getLocalTimeZone()), "en-US");

/** A moment `days` after this week's Sunday, at `hour` (fractions are minutes), in the device's time zone. */
const at = (days: number, hour: number) =>
  new Date(SUNDAY.add({ days }).toDate(getLocalTimeZone()).getTime() + hour * 3_600_000);

/** Scheduler: a clinic's week. */
export default function Week() {
  const t = useCatalogueText(MESSAGES.en);
  const events: SchedulerEvent[] = [
    { id: "1", title: t(K.checkup), start: at(2, 9), end: at(2, 10) },
    { id: "2", title: t(K.xray), start: at(2, 9.5), end: at(2, 10.5), tone: "warning" },
    { id: "3", title: t(K.staff), start: at(2, 13), end: at(2, 14), tone: "default" },
    { id: "4", title: t(K.cleaning), start: at(3, 11), end: at(3, 12), tone: "success" },
    { id: "5", title: t(K.consult), start: at(1, 15), end: at(1, 16.5) },
    {
      id: "6",
      title: t(K.holiday),
      start: at(4, 0),
      end: at(5, 0),
      isAllDay: true,
      tone: "danger",
    },
  ];
  return (
    <Scheduler
      defaultDate={SUNDAY.add({ days: 2 })}
      label={t(K.label)}
      events={events}
      startHour={8}
      endHour={18}
    />
  );
}
