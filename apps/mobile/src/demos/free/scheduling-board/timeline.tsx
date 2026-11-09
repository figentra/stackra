/**
 * Stackra file contract:
 * Purpose: the "timeline" demo of the native SchedulingBoard: two weeks of the academy on one strip per resource, with
 *          training and swim classes, the pool closed for two days, the coach on leave and a weekend hold.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); shared modules step 4a (LEADER, 2026-11-09).
 */
import { CalendarDate } from "@internationalized/date";
import type { SchedulingBoardItem, SchedulingBoardResource } from "@stackra/ui/contracts";
import { SchedulingBoard, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULING_BOARD_DEMO_KEYS } from "#src/demos/free/scheduling-board/scheduling-board-demo-keys.constant";

/** The demo's keys. */
const K = SCHEDULING_BOARD_DEMO_KEYS.demo_free.scheduling_board;

/** The branch's time zone: the board keeps its clock, not the viewer's. */
const ZONE = "Asia/Riyadh";

/** The first day shown, fixed so the demo reads the same on any date. */
const DAY = new CalendarDate(2026, 11, 15);

/** The days the strip spans. */
const DAYS = 14;

/** A moment `days` after the first day, at `hour` (fractions are minutes), in Riyadh. */
const at = (hour: number, days = 0) =>
  new Date(DAY.add({ days }).toDate(ZONE).getTime() + hour * 3_600_000);

/** SchedulingBoard: two weeks on a timeline. */
export default function Timeline() {
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
    ...[0, 2, 4, 7, 9, 11].map((day): SchedulingBoardItem => ({
      id: `training-${day}`,
      resourceIds: ["pitch-1"],
      start: at(16, day),
      end: at(17.5, day),
      kind: "booking",
      title: t(K.training),
    })),
    ...[1, 3, 8, 10].map((day): SchedulingBoardItem => ({
      id: `swim-${day}`,
      resourceIds: ["pool"],
      start: at(17, day),
      end: at(18, day),
      kind: "booking",
      title: t(K.swim_class),
      fill: { used: 8, total: 12 },
    })),
    {
      id: "maintenance",
      resourceIds: ["pool"],
      start: at(8, 5),
      end: at(22, 6),
      kind: "closure",
      title: t(K.maintenance),
    },
    {
      id: "leave",
      resourceIds: ["coach"],
      start: at(0, 7),
      end: at(0, 10),
      kind: "block",
      title: t(K.coach_leave),
      allDay: true,
    },
    {
      id: "hold",
      resourceIds: ["pitch-1-a"],
      start: at(9, 12),
      end: at(13, 12),
      kind: "hold",
      title: t(K.held),
      expiresAt: at(18),
    },
  ];
  return (
    <SchedulingBoard
      label={t(K.timeline_label)}
      resources={resources}
      items={items}
      defaultView="timeline"
      defaultDate={DAY}
      timelineDays={DAYS}
      timeZone={ZONE}
      now={at(15.5)}
      workingTime={Array.from({ length: DAYS }, (_, day) => ({
        start: at(8, day),
        end: at(22, day),
      }))}
    />
  );
}
