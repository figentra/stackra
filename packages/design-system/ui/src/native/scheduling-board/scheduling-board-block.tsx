/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardBlock`, one booking, hold or block on a native SchedulingBoard row: a soft block in its
 *          tone (the kind's by default) placed by its offset and lane, read as its title, time, row and status, and a
 *          button that reaches `onItemPress`. A long press picks it up and a drag moves it (time by the horizontal
 *          movement, snapped; rows by the vertical); a handle at its end edge changes its length. VoiceOver and
 *          TalkBack offer the same as accessibility actions: earlier, later, up, down, longer, shorter and open.
 * Boundary: internal; the board draws the preview from the reported draft and commits through the shared state, which
 *           holds the item pending while the screen's promise is open. An inherited item is faded and fixed here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.7 (a single-pointer
 *          alternative to dragging) and 4.1.2; shared modules step 4a (LEADER, 2026-11-09).
 */
// shortcut: PanResponder on the JS thread, because react-native-gesture-handler is not a dependency of this package
// (as SortableList); move the pan to a Gesture Handler `Gesture.Pan()` once it is added.
import type { Tone } from "@stackra/contracts";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  AccessibilityInfo,
  PanResponder,
  Pressable,
  Text as NativeText,
  View,
  type AccessibilityActionEvent,
  type PanResponderGestureState,
} from "react-native";

import type { SchedulingItemKind } from "#contracts/enums/scheduling-item-kind.enum";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import type { SchedulingBoardBlockProps } from "#native/scheduling-board/scheduling-board-block.props";
import { SCHEDULING_BOARD_METRICS } from "#native/scheduling-board/scheduling-board-metrics.constant";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The board's sizes. */
const M = SCHEDULING_BOARD_METRICS;

/** Each kind's tone when the item names none. */
const KIND_TONE: Readonly<Record<SchedulingItemKind, Tone>> = {
  booking: "accent",
  hold: "warning",
  closure: "danger",
  block: "default",
  working_time: "success",
};

/** A drag in progress: whether the pan took the touch, whether it resizes, and where it would land. */
interface Hold {
  /** True once the pan responder took the touch from the press. */
  granted: boolean;
  /** True for the end handle's drag. */
  readonly resize: boolean;
  /** Where the item would land now. */
  draft: SchedulingBoardDraft;
}

/** Where a draft lands: its row and its times. */
type Landing = Pick<SchedulingBoardDraft, "resourceId" | "start" | "end">;

/** Whether two drafts land in the same place. */
const sameDraft = (a: Landing, b: Landing) =>
  a.resourceId === b.resourceId &&
  a.start.getTime() === b.start.getTime() &&
  a.end.getTime() === b.end.getTime();

/** One block on a lane. */
export function SchedulingBoardBlock(props: SchedulingBoardBlockProps): ReactElement {
  const {
    state,
    placed,
    resource,
    width,
    isFirstRow,
    isLastRow,
    isDragging,
    onItemPress,
    renderItem,
  } = props;
  const t = useUiText();
  const { item } = placed;
  const canMove = state.canMove(placed);
  const canResize = state.canResize(placed);
  const isPending = state.isPending(item.id);

  // The pan handlers are made once (a responder rebuilt mid-gesture loses its gesture state), so they read the props
  // of the latest render from here.
  const latest = useRef({ ...props, cancelled: t(K.cancelled) });
  useEffect(() => {
    latest.current = { ...props, cancelled: t(K.cancelled) };
  });
  const hold = useRef<Hold | null>(null);

  /** The item where it is now, as a draft of the given change. */
  const baseOf = (change: "move" | "resize"): SchedulingBoardDraft => ({
    change,
    itemId: item.id,
    fromResourceId: resource.id,
    resourceId: resource.id,
    start: item.start,
    end: item.end,
  });

  /** Picks the item up: remembers the draft, reports it and says how to move it. */
  const pickUp = (draft: SchedulingBoardDraft, resize: boolean, granted: boolean) => {
    hold.current = { granted, resize, draft };
    haptics.play("impact");
    AccessibilityInfo.announceForAccessibility(state.startWordsOf(draft, item.title, true));
    props.onDraft(draft);
  };

  // oxlint-disable-next-line react/refs -- reason: the handlers read the refs on a gesture, never while rendering
  const [pans] = useState(() => {
    /** Reports a new draft when it lands somewhere else. */
    const follow = (next: SchedulingBoardDraft) => {
      const held = hold.current;
      if (!held || sameDraft(held.draft, next)) return;
      held.draft = next;
      haptics.play("selection");
      latest.current.onDraft(next);
    };
    /** Ends the drag: commits a draft that moved, or says it was cancelled. */
    const finish = (commit: boolean) => {
      const held = hold.current;
      hold.current = null;
      const current = latest.current;
      current.onDraft(null);
      if (!held) return;
      const { item: was } = current.placed;
      const where = { resourceId: current.resource.id, start: was.start, end: was.end };
      if (commit && !sameDraft(where, held.draft)) {
        haptics.play("impact");
        current.state.commitChange(held.draft);
      } else if (!commit) {
        AccessibilityInfo.announceForAccessibility(current.cancelled);
      }
    };
    /** The column offset a horizontal movement reads as. */
    const columnsOf = (gesture: PanResponderGestureState) =>
      (gesture.dx * latest.current.sign) / latest.current.width;
    const move = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => hold.current?.resize === false,
      onMoveShouldSetPanResponder: () => hold.current?.resize === false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (hold.current) hold.current.granted = true;
      },
      onPanResponderMove: (_event, gesture) => {
        const current = latest.current;
        const { state: now, placed: at } = current;
        const start = now.timeAt(at.offset + columnsOf(gesture));
        const length = at.item.end.getTime() - at.item.start.getTime();
        const base: SchedulingBoardDraft = {
          change: "move",
          itemId: at.item.id,
          fromResourceId: current.resource.id,
          resourceId: current.resource.id,
          start,
          end: new Date(start.getTime() + length),
        };
        follow(now.nudge(base, 0, current.rowStepsOf(current.resource.id, gesture.dy), false));
      },
      onPanResponderRelease: () => finish(true),
      onPanResponderTerminate: () => finish(false),
    });
    const resize = PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.state.canResize(latest.current.placed),
      onMoveShouldSetPanResponder: () => latest.current.state.canResize(latest.current.placed),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const { placed: at, resource: row } = latest.current;
        const draft: SchedulingBoardDraft = {
          change: "resize",
          itemId: at.item.id,
          fromResourceId: row.id,
          resourceId: row.id,
          start: at.item.start,
          end: at.item.end,
        };
        hold.current = { granted: true, resize: true, draft };
        haptics.play("impact");
        AccessibilityInfo.announceForAccessibility(
          latest.current.state.startWordsOf(draft, at.item.title, true),
        );
        latest.current.onDraft(draft);
      },
      onPanResponderMove: (_event, gesture) => {
        const held = hold.current;
        if (!held) return;
        const { state: now, placed: at } = latest.current;
        const end = now.timeAt(at.offset + at.length + columnsOf(gesture));
        const base = { ...held.draft, end: at.item.end };
        follow(
          end.getTime() > base.start.getTime()
            ? { ...base, end }
            : now.nudge({ ...base, end: base.start }, 1, 0, true),
        );
      },
      onPanResponderRelease: () => finish(true),
      onPanResponderTerminate: () => finish(false),
    });
    return { move, resize, finish };
  });

  const actions = [
    ...(canMove
      ? [
          { name: "earlier", label: t(K.action_earlier) },
          { name: "later", label: t(K.action_later) },
          ...(isFirstRow ? [] : [{ name: "up", label: t(K.action_up) }]),
          ...(isLastRow ? [] : [{ name: "down", label: t(K.action_down) }]),
        ]
      : []),
    ...(canResize
      ? [
          { name: "extend", label: t(K.action_extend) },
          { name: "shorten", label: t(K.action_shorten) },
        ]
      : []),
    ...(onItemPress ? [{ name: "open", label: t(K.action_open) }] : []),
  ];
  const act = (event: AccessibilityActionEvent) => {
    const name = event.nativeEvent.actionName;
    if (name === "open") {
      onItemPress?.(item);
      return;
    }
    const resize = name === "extend" || name === "shorten";
    if (resize ? !canResize : !canMove) return;
    const steps =
      name === "earlier" || name === "shorten" ? -1 : name === "later" || name === "extend" ? 1 : 0;
    const rows = name === "up" ? -1 : name === "down" ? 1 : 0;
    const base = baseOf(resize ? "resize" : "move");
    const next = state.nudge(base, steps, rows, resize);
    if (!sameDraft(base, next)) state.commitChange(next);
  };

  const laneHeight = (M.rowHeight - M.inset * 2) / placed.lanes;
  const tone = MARKER_TONE_CLASS_NAME[item.tone ?? KIND_TONE[item.kind]];
  // The fill goes on the block, the text colour on its lines.
  const ink = tone
    .split(" ")
    .filter((name) => name.startsWith("text-"))
    .join(" ");
  const facts = [state.timeOf(item), state.fillOf(item), state.countdownOf(item)].filter(
    (fact): fact is string => fact !== null,
  );
  const fade = isDragging
    ? "opacity-40"
    : placed.inherited
      ? "opacity-50"
      : isPending
        ? "opacity-60"
        : "";

  return (
    <View
      {...pans.move.panHandlers}
      className="absolute p-px"
      style={{
        start: placed.offset * width,
        width: Math.max(placed.length * width, 1),
        top: M.inset + placed.lane * laneHeight,
        height: laneHeight,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={state.nameOf(item, resource)}
        accessibilityState={{ busy: isPending }}
        {...(placed.inherited
          ? { accessibilityHint: state.inheritedLabelOf(item, props.ancestors) }
          : isPending
            ? { accessibilityHint: t(K.pending) }
            : {})}
        {...(actions.length === 0
          ? {}
          : { accessibilityActions: actions, onAccessibilityAction: act })}
        onPress={() => onItemPress?.(item)}
        {...(canMove
          ? {
              onLongPress: () => pickUp(baseOf("move"), false, false),
              onPressOut: () => {
                // A long press let go without a drag: nothing moved.
                if (hold.current && !hold.current.granted) pans.finish(false);
              },
            }
          : {})}
        className={`flex-1 overflow-hidden rounded-[var(--radius-control-inner)] px-1 py-0.5 ${tone} ${fade}`}
      >
        {renderItem?.(item) ?? (
          <>
            <NativeText numberOfLines={1} className={`text-xs font-medium ${ink}`}>
              {item.title}
            </NativeText>
            <View className="flex-row flex-wrap gap-x-1">
              {facts.map((fact) => (
                <NativeText key={fact} numberOfLines={1} className={`text-xs ${ink}`}>
                  {fact}
                </NativeText>
              ))}
            </View>
            {item.subtitle ? (
              <NativeText numberOfLines={1} className={`text-xs ${ink}`}>
                {item.subtitle}
              </NativeText>
            ) : null}
          </>
        )}
      </Pressable>
      {canResize ? (
        <View
          {...pans.resize.panHandlers}
          hitSlop={{ left: M.handleSlop, right: M.handleSlop }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-y-0 end-0 items-center justify-center"
          style={{ width: M.handleWidth }}
        >
          <View className="h-1/2 w-0.5 rounded-[var(--radius-pill)] bg-foreground/40" />
        </View>
      ) : null}
    </View>
  );
}
