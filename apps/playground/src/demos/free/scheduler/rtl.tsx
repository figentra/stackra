/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the web Scheduler: the week in a right-to-left Arabic block: the days run from the right
 *          and overlapping bookings sit from the right edge.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (RTL); STA-1371.
 */
import { getLocalTimeZone, startOfWeek, today } from "@internationalized/date";
import { Scheduler, useCatalogueText, type SchedulerEvent } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULER_KEYS } from "#src/demos/free/scheduler/scheduler-keys.constant";

/** The demo's keys. */
const K = SCHEDULER_KEYS.scheduler.rtl;

/** This week's Sunday, in the device's time zone. */
const SUNDAY = startOfWeek(today(getLocalTimeZone()), "en-US");

/** A moment `days` after this week's Sunday, at `hour` (fractions are minutes), in the device's time zone. */
const at = (days: number, hour: number) =>
  new Date(SUNDAY.add({ days }).toDate(getLocalTimeZone()).getTime() + hour * 3_600_000);

/** Scheduler: right to left. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  const events: SchedulerEvent[] = [
    { id: "1", title: t(K.checkup), start: at(2, 9), end: at(2, 10) },
    { id: "2", title: t(K.consult), start: at(2, 9.5), end: at(2, 11), tone: "warning" },
    { id: "3", title: t(K.staff), start: at(3, 13), end: at(3, 14), tone: "default" },
  ];
  return (
    <div dir="rtl" lang="ar" className="w-full">
      <Scheduler
        defaultDate={SUNDAY.add({ days: 2 })}
        label={t(K.label)}
        events={events}
        startHour={8}
        endHour={16}
      />
    </div>
  );
}
