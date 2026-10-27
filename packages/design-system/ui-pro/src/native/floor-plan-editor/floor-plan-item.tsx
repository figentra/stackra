/**
 * Stackra file contract:
 * Purpose: `FloorPlanItem`, one table, wall or label of the native `FloorPlanEditor`: a block a finger drags to move
 *          it and whose inline-end bottom corner it drags to resize it, with screen-reader actions (up, down, toward
 *          the start or end, wider, narrower, taller, shorter) that do the same as a drag.
 * Boundary: internal; reports distances and actions, never items: the editor snaps and proposes. Each gesture is a
 *           PanResponder held for the block's lifetime, so a re-render mid-drag keeps the gesture.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 and 4.1.2.
 */
import { Text } from "@stackra/ui/native";
import { useMemo, useRef, type ReactElement } from "react";
import { PanResponder, View, type PanResponderInstance } from "react-native";

import { FLOOR_SHAPE_CLASS } from "#core/constants/floor-shape-class.constant";
import type { FloorPlanItemAction } from "#native/floor-plan-editor/floor-plan-item-action.type";
import type { FloorPlanItemProps } from "#native/floor-plan-editor/floor-plan-item.props";

/** The order the actions are offered in. */
const ACTIONS: readonly FloorPlanItemAction[] = Object.freeze([
  "move_up",
  "move_down",
  "move_start",
  "move_end",
  "widen",
  "narrow",
  "taller",
  "shorter",
]);

/** One item on the floor plan. */
export function FloorPlanItem(props: FloorPlanItemProps): ReactElement {
  const { item, cellSize, isSelected, isMovable, label, hint, actionLabels } = props;
  // The gestures read the latest callbacks through this ref: each PanResponder is created once.
  const latest = useRef(props);
  // oxlint-disable-next-line react/refs -- reason: the ref holds the latest props for gesture handlers created once; it is never read to render
  latest.current = props;

  const [move, resize] = useMemo(() => {
    const gesture = (mode: "move" | "resize"): PanResponderInstance =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => latest.current.isMovable,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => latest.current.onSelect(),
        onPanResponderMove: (_, state) => {
          if (latest.current.isMovable) latest.current.onDrag(mode, state.dx, state.dy);
        },
        onPanResponderRelease: (_, state) => {
          if (latest.current.isMovable) latest.current.onDrop(mode, state.dx, state.dy);
        },
        onPanResponderTerminate: () => latest.current.onCancel(),
      });
    // oxlint-disable-next-line react/refs -- reason: the gestures read the ref in their handlers, never during render
    return [gesture("move"), gesture("resize")];
  }, []);

  return (
    <View
      {...move.panHandlers}
      testID={`floor-item-${item.id}`}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: isSelected, disabled: !isMovable }}
      accessibilityActions={
        isMovable
          ? [{ name: "activate" }, ...ACTIONS.map((name) => ({ name, label: actionLabels[name] }))]
          : [{ name: "activate" }]
      }
      onAccessibilityAction={({ nativeEvent }) => {
        const name = nativeEvent.actionName as FloorPlanItemAction;
        if (nativeEvent.actionName === "activate") latest.current.onSelect();
        else if (ACTIONS.includes(name)) latest.current.onAction(name);
      }}
      className={`absolute items-center justify-center overflow-hidden ${FLOOR_SHAPE_CLASS[item.shape]} ${isSelected ? "border-2 border-accent" : ""}`}
      style={{
        insetInlineStart: item.x * cellSize,
        top: item.y * cellSize,
        width: item.width * cellSize,
        height: item.height * cellSize,
      }}
    >
      {item.shape === "wall" ? null : (
        <Text type="caption" isTruncated align="center">
          {item.label}
        </Text>
      )}
      {isMovable ? (
        <View
          {...resize.panHandlers}
          testID="floor-item-resize-handle"
          importantForAccessibility="no"
          className="absolute end-0 bottom-0 size-4"
        />
      ) : null}
    </View>
  );
}
