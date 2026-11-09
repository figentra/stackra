/**
 * Stackra file contract:
 * Purpose: the "day" demo of the native SchedulingBoard: a sports academy's day in Riyadh, two branches with a pitch and
 *          its half, a coach and a pool; bookings, a hold counting down, a closure, a break and working time from 8 to
 *          22; an empty range selected is written under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); shared modules step 4a (LEADER, 2026-11-09).
 */
import { CalendarDate } from "@internationalized/date";
import type { SchedulingBoardItem, SchedulingBoardResource } from "@stackra/ui/contracts";
import { SchedulingBoard, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEDULING_BOARD_DEMO_KEYS } from "#src/demos/free/scheduling-board/scheduling-board-demo-keys.constant";

/** The demo's keys. */
const K = SCHEDULING_BOARD_DEMO_KEYS.demo_free.scheduling_board;

/** The branch's time zone: the board keeps its clock, not the viewer's. */
const ZONE = "Asia/Riyadh";

/** The day shown, fixed so the demo reads the same on any date. */
const DAY = new CalendarDate(2026, 11, 15);

/** A moment `days` after the day shown, at `hour` (fractions are minutes), in Riyadh. */
const at = (hour: number, days = 0) =>
  new Date(DAY.add({ days }).toDate(ZONE).getTime() + hour * 3_600_000);

/** SchedulingBoard: an academy's day. */
export default function Day() {
  const t = useCatalogueText(MESSAGES.en);
  const [selected, setSelected] = useState<string>();
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
    {
      id: "training",
      resourceIds: ["pitch-1", "coach"],
      start: at(16),
      end: at(17.5),
      kind: "booking",
      title: t(K.training),
      subtitle: t(K.coach),
    },
    {
      id: "five-a-side",
      resourceIds: ["pitch-1-a"],
      start: at(18),
      end: at(19),
      kind: "booking",
      title: t(K.five_a_side),
    },
    {
      id: "swim",
      resourceIds: ["pool"],
      start: at(17),
      end: at(18),
      kind: "booking",
      title: t(K.swim_class),
      fill: { used: 8, total: 12 },
    },
    {
      id: "hold",
      resourceIds: ["pitch-1"],
      start: at(19),
      end: at(20.5),
      kind: "hold",
      title: t(K.held),
      expiresAt: at(15.75),
    },
    {
      id: "cleaning",
      resourceIds: ["pool"],
      start: at(12),
      end: at(14),
      kind: "closure",
      title: t(K.cleaning),
    },
    {
      id: "break",
      resourceIds: ["coach"],
      start: at(13),
      end: at(14),
      kind: "block",
      title: t(K.coach_break),
    },
  ];
  return (
    <View className="gap-2">
      <SchedulingBoard
        label={t(K.day_label)}
        resources={resources}
        items={items}
        defaultDate={DAY}
        timeZone={ZONE}
        now={at(15.5)}
        startHour={7}
        endHour={23}
        workingTime={[{ start: at(8), end: at(22) }]}
        onSelectRange={(range) =>
          setSelected(
            t(K.selected, {
              minutes: (range.end.getTime() - range.start.getTime()) / 60_000,
              row: resources.find((row) => row.id === range.resourceId)?.label ?? "",
            }),
          )
        }
      />
      {selected ? <Text tone="muted">{selected}</Text> : null}
    </View>
  );
}
