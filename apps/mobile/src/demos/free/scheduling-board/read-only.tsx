/**
 * Stackra file contract:
 * Purpose: the "read-only" demo of the native SchedulingBoard: the academy's day for someone who may look but not change
 *          it: nothing is selected, moved or resized, and a pressed block is written under it.
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

/** A moment on the day shown, at `hour` (fractions are minutes), in Riyadh. */
const at = (hour: number) => new Date(DAY.toDate(ZONE).getTime() + hour * 3_600_000);

/** The SchedulingBoard demo: read-only. */
export default function ReadOnly() {
  const t = useCatalogueText(MESSAGES.en);
  const [picked, setPicked] = useState<string>();
  const resources: SchedulingBoardResource[] = [
    { id: "pitch-1", label: t(K.pitch_1), kind: "room", capacity: 1, group: t(K.north) },
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
      id: "swim",
      resourceIds: ["pool"],
      start: at(17),
      end: at(18),
      kind: "booking",
      title: t(K.swim_class),
      fill: { used: 8, total: 12 },
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
        label={t(K.read_only_label)}
        resources={resources}
        items={items}
        defaultDate={DAY}
        timeZone={ZONE}
        now={at(15.5)}
        startHour={8}
        endHour={22}
        workingTime={[{ start: at(8), end: at(22) }]}
        readOnly
        onItemPress={(item) => setPicked(item.title)}
      />
      {picked ? <Text tone="muted">{t(K.picked, { title: picked })}</Text> : null}
    </View>
  );
}
