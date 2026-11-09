/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardLane`, one resource row's time area on the native SchedulingBoard: the past, the time
 *          outside working hours and the rest days shaded; working time as a band behind; each empty slot a button
 *          that selects it (a long press then a drag across the lane extends the range); closures across the row,
 *          translucent; the blocks in their lanes; the drag preview when a drag would land here, coloured by its
 *          heaviest conflict; and the current-time line.
 * Boundary: internal; positions are `offset * width` from the inline start, so the lane mirrors in right-to-left. A
 *           selected range is reported through the shared state, which says it in the live region.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.7, 2.5.8 and 4.1.2; shared
 *          modules step 4a (LEADER, 2026-11-09).
 */
// shortcut: one Pressable per slot keeps every slot reachable by VoiceOver and TalkBack, which is heavy for a week of
// 15-minute slots on many rows; virtualise the slots (and the rows, see useSchedulingBoardState) past about 200 rows.
import { useEffect, useRef, useState, type ReactElement } from "react";
import { AccessibilityInfo, PanResponder, Pressable, Text as NativeText, View } from "react-native";

import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import { schedulingPositionOf } from "#core/functions/scheduling-position-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { SchedulingBoardBlock } from "#native/scheduling-board/scheduling-board-block";
import type { SchedulingBoardLaneProps } from "#native/scheduling-board/scheduling-board-lane.props";
import { SCHEDULING_BOARD_METRICS } from "#native/scheduling-board/scheduling-board-metrics.constant";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The board's sizes. */
const M = SCHEDULING_BOARD_METRICS;

/** A range selection in progress: the slot it started on, whether the pan took the touch, and the range now. */
interface Selection {
  /** The column the long press was on. */
  readonly anchor: number;
  /** True once the pan responder took the touch from the slot's press. */
  granted: boolean;
  /** The range now. */
  draft: SchedulingBoardDraft;
}

/** One resource row's time area. */
export function SchedulingBoardLane(props: SchedulingBoardLaneProps): ReactElement {
  const {
    state,
    resource,
    ancestors,
    width,
    sign,
    isFirstRow,
    isLastRow,
    canSelect,
    dayShade,
    draft,
    conflicts,
    onDraft,
    rowStepsOf,
    onItemPress,
    renderItem,
  } = props;
  const t = useUiText();
  const { columns } = state;

  // The pan handlers are made once (a responder rebuilt mid-gesture loses its gesture state), so they read the props
  // of the latest render from here.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });
  const selection = useRef<Selection | null>(null);

  /** The one-slot range of a column. */
  const slotDraft = (index: number): SchedulingBoardDraft | null => {
    const column = columns[index];
    return column
      ? {
          change: "select",
          itemId: null,
          fromResourceId: null,
          resourceId: resource.id,
          start: column.start,
          end: column.end,
        }
      : null;
  };

  // oxlint-disable-next-line react/refs -- reason: the handlers read the refs on a gesture, never while rendering
  const [pan] = useState(() => {
    /** Ends the selection: reports the range, or drops it when the pan was taken away. */
    const finish = (commit: boolean) => {
      const held = selection.current;
      selection.current = null;
      latest.current.onDraft(null);
      if (held && commit) latest.current.state.commitRange(held.draft);
    };
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => selection.current !== null,
      onMoveShouldSetPanResponder: () => selection.current !== null,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (selection.current) selection.current.granted = true;
      },
      onPanResponderMove: (_event, gesture) => {
        const held = selection.current;
        if (!held) return;
        const { state: now, width: size, sign: way } = latest.current;
        const last = now.columns.length - 1;
        const at = Math.min(last, Math.max(0, held.anchor + Math.round((gesture.dx * way) / size)));
        const from = now.columns[Math.min(held.anchor, at)];
        const to = now.columns[Math.max(held.anchor, at)];
        if (!from || !to) return;
        if (
          from.start.getTime() === held.draft.start.getTime() &&
          to.end.getTime() === held.draft.end.getTime()
        ) {
          return;
        }
        held.draft = { ...held.draft, start: from.start, end: to.end };
        haptics.play("selection");
        latest.current.onDraft(held.draft);
      },
      onPanResponderRelease: () => finish(true),
      onPanResponderTerminate: () => finish(false),
    });
    return { responder, finish };
  });

  /** Starts a range on a long-pressed slot. */
  const startSelection = (index: number) => {
    const first = slotDraft(index);
    if (!first) return;
    selection.current = { anchor: index, granted: false, draft: first };
    haptics.play("impact");
    AccessibilityInfo.announceForAccessibility(state.startWordsOf(first, null, true));
    onDraft(first);
  };

  const span = (offset: number, length: number) => ({
    start: offset * width,
    width: Math.max(length * width, 0),
  });
  const placements = state.placementsOf(resource.id, ancestors);
  const past = state.pastLength > 0 ? [{ offset: 0, length: state.pastLength }] : [];
  const preview =
    draft?.resourceId === resource.id
      ? {
          offset: schedulingPositionOf(draft.start, columns),
          end: schedulingPositionOf(draft.end, columns),
        }
      : null;
  const heaviest = conflicts.some((conflict) => conflict.severity === "block")
    ? "border-danger bg-danger/10"
    : conflicts.length > 0
      ? "border-warning bg-warning/30"
      : "border-accent bg-accent/10";

  return (
    <View
      {...pan.responder.panHandlers}
      className="relative border-b border-separator"
      style={{ height: M.rowHeight, width: columns.length * width }}
    >
      {past.map((stretch) => (
        <View
          key="past"
          pointerEvents="none"
          className="absolute inset-y-0 bg-default/40"
          style={span(stretch.offset, stretch.length)}
        />
      ))}
      {dayShade.map((stretch) => (
        <View
          key={`day-${stretch.offset}`}
          pointerEvents="none"
          className="absolute inset-y-0 bg-default/40"
          style={span(stretch.offset, stretch.length)}
        />
      ))}
      {state.shadeOf(resource.id).map((stretch) => (
        <View
          key={`shade-${stretch.offset}`}
          pointerEvents="none"
          className="absolute inset-y-0 bg-default/60"
          style={span(stretch.offset, stretch.length)}
        />
      ))}
      {placements
        .filter((placed) => placed.layer === "band")
        .map((placed) => (
          <View
            key={placed.item.id}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-y-0 bg-success/10"
            style={span(placed.offset, placed.length)}
          />
        ))}
      {columns.map((column, index) =>
        index > 0 && column.opensDay ? (
          <View
            key={`edge-${column.start.getTime()}`}
            pointerEvents="none"
            className="absolute inset-y-0 border-s border-separator"
            style={{ start: index * width }}
          />
        ) : null,
      )}
      {canSelect ? (
        <View className="absolute inset-0 flex-row">
          {columns.map((column, index) => (
            <Pressable
              key={column.start.getTime()}
              accessibilityRole="button"
              accessibilityLabel={state.slotNameOf(resource, column)}
              onPress={() => {
                const one = slotDraft(index);
                if (one) state.commitRange(one);
              }}
              onLongPress={() => startSelection(index)}
              onPressOut={() => {
                // A long press let go without a drag selects the one slot.
                if (selection.current && !selection.current.granted) pan.finish(true);
              }}
              style={{ width }}
              className="h-full"
            />
          ))}
        </View>
      ) : null}
      {placements
        .filter((placed) => placed.layer === "cover")
        .map((placed) => {
          const name = `${t(K.kind_closure)}, ${state.nameOf(placed.item, resource)}`;
          const body = (
            <NativeText
              numberOfLines={1}
              className="px-1 text-xs font-medium text-danger-soft-foreground"
            >
              {placed.item.title}
            </NativeText>
          );
          return onItemPress ? (
            <Pressable
              key={placed.item.id}
              accessibilityRole="button"
              accessibilityLabel={name}
              onPress={() => onItemPress(placed.item)}
              className={`absolute inset-y-0 justify-center bg-danger-soft/70 ${
                placed.inherited ? "opacity-50" : ""
              }`}
              style={span(placed.offset, placed.length)}
            >
              {body}
            </Pressable>
          ) : (
            <View
              key={placed.item.id}
              accessible
              accessibilityLabel={name}
              className={`absolute inset-y-0 justify-center bg-danger-soft/70 ${
                placed.inherited ? "opacity-50" : ""
              }`}
              style={span(placed.offset, placed.length)}
            >
              {body}
            </View>
          );
        })}
      {placements
        .filter((placed) => placed.layer === "block")
        .map((placed) => (
          <SchedulingBoardBlock
            key={placed.item.id}
            state={state}
            placed={placed}
            resource={resource}
            ancestors={ancestors}
            width={width}
            sign={sign}
            isFirstRow={isFirstRow}
            isLastRow={isLastRow}
            isDragging={draft?.itemId === placed.item.id}
            onDraft={onDraft}
            rowStepsOf={rowStepsOf}
            onItemPress={onItemPress}
            renderItem={renderItem}
          />
        ))}
      {preview ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className={`absolute rounded-[var(--radius-control-inner)] border-2 border-dashed ${heaviest}`}
          style={{
            ...span(preview.offset, preview.end - preview.offset),
            top: M.inset,
            bottom: M.inset,
          }}
        />
      ) : null}
      {state.nowAt === null ? null : (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-y-0 w-0.5 bg-danger"
          style={{ start: state.nowAt * width }}
        />
      )}
    </View>
  );
}
