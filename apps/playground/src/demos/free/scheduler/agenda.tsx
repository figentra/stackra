/**
 * Stackra file contract:
 * Purpose: the "agenda" demo of the web Scheduler: the month as a list of the days that have bookings.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import { Scheduler, useCatalogueText, type SchedulerEvent } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULER_KEYS } from "#src/demos/free/scheduler/scheduler-keys.constant";

/** The demo's keys. */
const K = SCHEDULER_KEYS.scheduler;

/** A moment `days` from today, at `hour`, in the device's time zone. */
const at = (days: number, hour: number) =>
  new Date(
    today(getLocalTimeZone()).add({ days }).toDate(getLocalTimeZone()).getTime() + hour * 3_600_000,
  );

/** Scheduler: the agenda. */
export default function Agenda() {
  const t = useCatalogueText(MESSAGES.en);
  const events: SchedulerEvent[] = [
    { id: "1", title: t(K.checkup), start: at(0, 9), end: at(0, 10) },
    { id: "2", title: t(K.staff), start: at(0, 13), end: at(0, 14), tone: "default" },
    { id: "3", title: t(K.cleaning), start: at(1, 11), end: at(1, 12), tone: "success" },
    {
      id: "4",
      title: t(K.holiday),
      start: at(2, 0),
      end: at(3, 0),
      isAllDay: true,
      tone: "danger",
    },
  ];
  return <Scheduler label={t(K.label)} events={events} defaultView="agenda" />;
}
