/**
 * Stackra file contract:
 * Purpose: the "drag" demo of the native SchedulingBoard: move or resize a booking on a 30-minute grid; the coach's own
 *          conflict warns past 20:00, and the screen's check refuses every move, so the booking snaps back after the
 *          promise from `onItemChange` resolves to `false`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The refusal stands in for the engine's answer (`booking.move`), which a real screen would await.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); shared modules step 4a (LEADER, 2026-11-09).
 */
import { CalendarDate } from "@internationalized/date";
import type {
  SchedulingBoardConflict,
  SchedulingBoardDraft,
  SchedulingBoardItem,
  SchedulingBoardResource,
} from "@stackra/ui/contracts";
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

/** How long the stand-in check takes, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's stand-in server check, not motion
const CHECK_MS = 800;

/** A moment on the day shown, at `hour` (fractions are minutes), in Riyadh. */
const at = (hour: number) => new Date(DAY.toDate(ZONE).getTime() + hour * 3_600_000);

/** SchedulingBoard: a move the server refuses. */
export default function Drag() {
  const t = useCatalogueText(MESSAGES.en);
  const [note, setNote] = useState<string>();
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
      movable: false,
    },
  ];
  /** The screen's own conflict: the coach leaves at 20:00. */
  const conflictsOf = (draft: SchedulingBoardDraft): SchedulingBoardConflict[] =>
    draft.resourceId === "coach" && draft.end.getTime() > at(20).getTime()
      ? [{ reason: "coach_leaves", severity: "warn", message: t(K.coach_leaves) }]
      : [];
  return (
    <View className="gap-2">
      <SchedulingBoard
        label={t(K.drag_label)}
        resources={resources}
        items={items}
        defaultDate={DAY}
        timeZone={ZONE}
        now={at(10)}
        slotMinutes={30}
        startHour={8}
        endHour={22}
        workingTime={[{ start: at(8), end: at(22) }]}
        conflictsOf={conflictsOf}
        onItemChange={async () => {
          setNote(t(K.checking));
          await new Promise((resolve) => {
            setTimeout(resolve, CHECK_MS);
          });
          setNote(t(K.refused));
          return false;
        }}
      />
      {note ? (
        <Text tone="muted" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}
    </View>
  );
}
