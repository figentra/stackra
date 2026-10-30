/**
 * Stackra file contract:
 * Purpose: the native `SwipeableRow`: a list row that slides aside under a horizontal drag to reveal its start actions
 *          (dragged toward the reading end) or its end actions (toward the start), snapping open past half of them and
 *          closed short of it; an action press runs it and closes the row. Every action is also a VoiceOver and
 *          TalkBack custom action on the row, so nothing needs the swipe.
 * Boundary: the drag is React Native's PanResponder driving a Reanimated value (this package has no gesture-handler
 *           dependency); it claims only clearly horizontal drags, so the list still scrolls. Sides follow
 *           `useDirection`. The hidden actions are hidden from screen readers until revealed. Reduced motion drops the
 *           spring.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.5.1.
 */
import type { Tone } from "@stackra/contracts";
import { cn, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useMemo, useRef, useState, type ReactElement } from "react";
import { PanResponder, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { SwipeAction } from "#contracts/types/swipe-action.type";
import { useDirection } from "#native/bidi/use-direction";
import { haptics } from "#native/haptics/haptics";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { SwipeableRowProps } from "#native/swipeable-row/swipeable-row.props";

/** The width of one action, in points, and how far a drag must go before it is a swipe. */
const ACTION_WIDTH = 76;
const SLOP = 10;
/** The fill of each tone; literal class strings so Uniwind finds them. */
const FILL: Readonly<Record<Tone, string>> = Object.freeze({
  default: "bg-default",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
});

/** One revealed action: its icon over its words, in the tone's colours. */
function ActionButton({
  action,
  onChoose,
}: {
  readonly action: SwipeAction;
  readonly onChoose: (action: SwipeAction) => void;
}): ReactElement {
  const tone = action.tone ?? "default";
  const color = useThemeColor(tone === "default" ? "default-foreground" : `${tone}-foreground`);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={() => onChoose(action)}
      style={{ width: ACTION_WIDTH }}
      className={cn("items-center justify-center gap-1", FILL[tone]) ?? ""}
    >
      <LucideProvider color={color} size={20}>
        <SlotIcon icon={action.icon} />
      </LucideProvider>
      <Animated.Text style={{ color, fontSize: 12, fontWeight: "500" }} numberOfLines={1}>
        {action.label}
      </Animated.Text>
    </Pressable>
  );
}

/** The `startActions` default, one array for every render. */
const NO_START_ACTIONS: NonNullable<SwipeableRowProps["startActions"]> = [];

/** The `endActions` default, one array for every render. */
const NO_END_ACTIONS: NonNullable<SwipeableRowProps["endActions"]> = [];

/** A row that slides aside to reveal its actions. */
export function SwipeableRow({
  children,
  startActions = NO_START_ACTIONS,
  endActions = NO_END_ACTIONS,
  onAction,
  isDisabled = false,
  className,
  ...rest
}: SwipeableRowProps): ReactElement {
  const sign = useDirection() === "rtl" ? -1 : 1;
  const isReduced = useReducedMotion();
  // The row's offset along the reading direction: positive reveals the start actions, negative the end ones.
  const offset = useSharedValue(0);
  const resting = useRef(0);
  const [openSide, setOpenSide] = useState<"start" | "end" | null>(null);
  const startWidth = startActions.length * ACTION_WIDTH;
  const endWidth = endActions.length * ACTION_WIDTH;

  const snap = (to: number) => {
    resting.current = to;
    offset.set(isReduced ? to : withSpring(to, { damping: 24, stiffness: 240 }));
    const side = to > 0 ? "start" : to < 0 ? "end" : null;
    if (side !== null && side !== openSide) haptics.play("selection");
    setOpenSide(side);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !isDisabled &&
          Math.abs(gesture.dx) > SLOP &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => {
          offset.set(
            Math.min(Math.max(resting.current + gesture.dx * sign, -endWidth), startWidth),
          );
        },
        onPanResponderRelease: () => {
          const at = offset.get();
          snap(at > startWidth / 2 ? startWidth : at < -endWidth / 2 ? -endWidth : 0);
        },
        onPanResponderTerminate: () => snap(resting.current),
      }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `snap` reads the same state as the deps below.
    [isDisabled, sign, startWidth, endWidth, openSide, isReduced],
  );
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() * sign }] }));

  const choose = (action: SwipeAction) => {
    action.onPress?.();
    onAction?.(action.id);
    snap(0);
  };
  const all = [...startActions, ...endActions];
  const hidden = (side: "start" | "end") =>
    openSide === side
      ? {}
      : ({
          accessibilityElementsHidden: true,
          importantForAccessibility: "no-hide-descendants",
        } as const);

  return (
    <View {...rest} className={cn("relative overflow-hidden", className) ?? ""}>
      <View
        style={{ position: "absolute", top: 0, bottom: 0, start: 0 }}
        className="flex-row"
        {...hidden("start")}
      >
        {startActions.map((action) => (
          <ActionButton key={action.id} action={action} onChoose={choose} />
        ))}
      </View>
      <View
        style={{ position: "absolute", top: 0, bottom: 0, end: 0 }}
        className="flex-row"
        {...hidden("end")}
      >
        {endActions.map((action) => (
          <ActionButton key={action.id} action={action} onChoose={choose} />
        ))}
      </View>
      <Animated.View
        {...responder.panHandlers}
        accessibilityActions={all.map((action) => ({ name: action.id, label: action.label }))}
        onAccessibilityAction={(event) => {
          const action = all.find((item) => item.id === event.nativeEvent.actionName);
          if (action) choose(action);
        }}
        style={rowStyle}
        className="bg-background"
      >
        {children}
      </Animated.View>
    </View>
  );
}
