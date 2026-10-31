/**
 * Stackra file contract:
 * Purpose: the "week" demo of the web Scheduler: a clinic's week from 8 to 18, with overlapping bookings side by side,
 *          an all-day holiday, and the pressed booking written below.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { getLocalTimeZone, startOfWeek, today } from "@internationalized/date";
import { Scheduler, Text, useCatalogueText, type SchedulerEvent } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULER_KEYS } from "#src/demos/free/scheduler/scheduler-keys.constant";

/** The demo's keys. */
const K = SCHEDULER_KEYS.scheduler;

/** This week's Sunday, in the device's time zone. */
const SUNDAY = startOfWeek(today(getLocalTimeZone()), "en-US");

/** A moment `days` after this week's Sunday, at `hour` (fractions are minutes), in the device's time zone. */
const at = (days: number, hour: number) =>
  new Date(SUNDAY.add({ days }).toDate(getLocalTimeZone()).getTime() + hour * 3_600_000);

/** Scheduler: a clinic's week. */
export default function Week() {
  const t = useCatalogueText(MESSAGES.en);
  const [picked, setPicked] = useState<string>();
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
    <div className="grid w-full gap-2">
      <Scheduler
        defaultDate={SUNDAY.add({ days: 2 })}
        label={t(K.label)}
        events={events}
        startHour={8}
        endHour={18}
        onEventPress={(event) => setPicked(event.title)}
      />
      {picked ? (
        <Text type="small" tone="muted">
          {t(K.picked, { title: picked })}
        </Text>
      ) : null}
    </div>
  );
}
