/**
 * Stackra file contract:
 * Purpose: the "week" demo of the web SchedulingBoard: the academy's week from Sunday, training three evenings, swim
 *          classes with their fill, a day the pool is closed for maintenance and a hold on Wednesday.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); shared modules step 4a (LEADER, 2026-11-09).
 */
import { CalendarDate } from "@internationalized/date";
import type { SchedulingBoardItem, SchedulingBoardResource } from "@stackra/ui/contracts";
import { SchedulingBoard, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULING_BOARD_KEYS } from "#src/demos/free/scheduling-board/scheduling-board-keys.constant";

/** The demo's keys. */
const K = SCHEDULING_BOARD_KEYS.scheduling_board;

/** The branch's time zone: the board keeps its clock, not the viewer's. */
const ZONE = "Asia/Riyadh";

/** The week's Sunday, fixed so the demo reads the same on any date. */
const SUNDAY = new CalendarDate(2026, 11, 15);

/** A moment `days` after Sunday, at `hour` (fractions are minutes), in Riyadh. */
const at = (hour: number, days = 0) =>
  new Date(SUNDAY.add({ days }).toDate(ZONE).getTime() + hour * 3_600_000);

/** SchedulingBoard: the academy's week. */
export default function Week() {
  const t = useCatalogueText(MESSAGES.en);
  const resources: SchedulingBoardResource[] = [
    { id: "pitch-1", label: t(K.pitch_1), kind: "room", capacity: 1, group: t(K.north) },
    {
      id: "pitch-1-a",
      label: t(K.pitch_1_half_a),
      kind: "room",
      parentId: "pitch-1",
      group: t(K.north),
    },
    { id: "coach", label: t(K.coach), kind: "person", group: t(K.north) },
    { id: "pool", label: t(K.pool), kind: "room", capacity: 12, group: t(K.south) },
  ];
  const items: SchedulingBoardItem[] = [
    ...[0, 2, 4].map((day): SchedulingBoardItem => ({
      id: `training-${day}`,
      resourceIds: ["pitch-1", "coach"],
      start: at(16, day),
      end: at(17.5, day),
      kind: "booking",
      title: t(K.training),
      subtitle: t(K.coach),
    })),
    ...[1, 3].map((day): SchedulingBoardItem => ({
      id: `swim-${day}`,
      resourceIds: ["pool"],
      start: at(17, day),
      end: at(18, day),
      kind: "booking",
      title: t(K.swim_class),
      fill: { used: day === 1 ? 12 : 7, total: 12 },
    })),
    {
      id: "five-a-side",
      resourceIds: ["pitch-1-a"],
      start: at(18, 1),
      end: at(19, 1),
      kind: "booking",
      title: t(K.five_a_side),
    },
    {
      id: "maintenance",
      resourceIds: ["pool"],
      start: at(8, 2),
      end: at(22, 2),
      kind: "closure",
      title: t(K.maintenance),
    },
    {
      id: "hold",
      resourceIds: ["pitch-1"],
      start: at(19, 3),
      end: at(20.5, 3),
      kind: "hold",
      title: t(K.held),
      expiresAt: at(18),
    },
  ];
  return (
    <SchedulingBoard
      label={t(K.week_label)}
      resources={resources}
      items={items}
      defaultView="week"
      defaultDate={SUNDAY}
      timeZone={ZONE}
      now={at(15.5)}
      startHour={8}
      endHour={22}
      workingTime={Array.from({ length: 7 }, (_, day) => ({ start: at(8, day), end: at(22, day) }))}
    />
  );
}
