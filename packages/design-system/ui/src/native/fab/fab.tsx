/**
 * Stackra file contract:
 * Purpose: the native `Fab`: a round floating action button (an IconButton, or a Button with its label when extended)
 *          pinned to a bottom corner by reading direction, and with `actions` a speed dial: the related actions fade
 *          up above it one after another, each a small IconButton with its label, while the plus turns into a cross.
 * Boundary: builds on `#native/button/button` and `#native/icon-button/icon-button` (their press haptic included). It
 *           floats in its nearest positioned ancestor (`absolute`, logical `start`/`end`), and lets presses through
 *           around it; while it floats it counts itself in `FLOATING_FABS`, so a bottom toast clears it. No scrim: a second press on the Fab or an action closes the dial. Reduced motion skips the
 *           fades and the turn.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 4.1.2 (the dial's expanded state).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import type { FabPlacement } from "#contracts/enums/fab-placement.enum";
import type { FabAction } from "#contracts/types/fab-action.type";
import { FLOATING_FABS } from "#core/constants/floating-fabs.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#native/button/button";
import type { FabProps } from "#native/fab/fab.props";
import { IconButton } from "#native/icon-button/icon-button";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";

const FAST = motionTiming(STACKRA_THEME, "fast");
/** The gap from the screen edges, in points: Material's 16. */
const EDGE = 16;
/** The delay between two actions fading in, in ms. */
const STAGGER_MS = 30;

/** Where the Fab sits in its positioned ancestor; logical sides, so the corners follow the reading direction. */
const POSITION: Readonly<Record<FabPlacement, ViewStyle>> = Object.freeze({
  "bottom-end": { position: "absolute", bottom: EDGE, end: EDGE, alignItems: "flex-end" },
  "bottom-start": { position: "absolute", bottom: EDGE, start: EDGE, alignItems: "flex-start" },
  "bottom-center": { position: "absolute", bottom: EDGE, start: 0, end: 0, alignItems: "center" },
  inline: { alignItems: "flex-start" },
});

/** The one main action of a screen, floating over it, or a speed dial of related actions. */
export function Fab({
  label,
  icon = "plus",
  isExtended = false,
  onPress,
  actions,
  onAction,
  placement = "bottom-end",
  variant = "primary",
  size = "lg",
  isDisabled,
  isOpen,
  defaultOpen,
  onOpenChange,
  style,
  className,
  ...rest
}: FabProps): ReactElement {
  const hasDial = actions !== undefined && actions.length > 0;
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = hasDial && (isOpen ?? ownOpen);
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const isReduced = useReducedMotion();
  // A floating Fab tells the ToastProvider it is there, so a bottom toast is lifted clear of it.
  useEffect(() => (placement === "inline" ? undefined : FLOATING_FABS.register()), [placement]);
  // The plus turns an eighth into a cross; any other icon is swapped for a cross instead.
  const turn = useSharedValue(open ? 45 : 0);
  useEffect(() => {
    const to = open && icon === "plus" ? 45 : 0;
    turn.set(isReduced ? to : withTiming(to, { duration: FAST.durationMs }));
  }, [open, icon, isReduced, turn]);
  const turnStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));
  const drawn = (
    <Animated.View style={turnStyle}>
      <SlotIcon icon={open && icon !== "plus" ? "x" : icon} />
    </Animated.View>
  );

  const press = () => {
    onPress?.();
    if (hasDial) setOpen(!open);
  };
  const choose = (action: FabAction) => {
    action.onPress?.();
    onAction?.(action.id);
    setOpen(false);
  };
  const shared = {
    variant,
    size,
    onPress: press,
    className: "rounded-[var(--radius-pill)] shadow-lg",
    ...(hasDial ? { accessibilityState: { expanded: open } } : {}),
    ...omitUndefined({ isDisabled }),
  };
  // At the start corner the label sits after the small button; elsewhere before it, toward the screen's middle.
  const isStart = placement === "bottom-start";

  // A floating dial dims what is under it; a press on the scrim closes the dial. An inline Fab has nothing to cover.
  const scrim =
    open && placement !== "inline" ? (
      <Animated.View
        entering={FadeIn.duration(FAST.durationMs).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(FAST.durationMs).reduceMotion(ReduceMotion.System)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="flex-1 bg-backdrop"
          onPress={() => setOpen(false)}
        />
      </Animated.View>
    ) : null;

  return (
    <>
      {scrim}
      <View
        {...rest}
        pointerEvents="box-none"
        style={[POSITION[placement], style]}
        className={cn("gap-3", className) ?? ""}
      >
        {open
          ? actions.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={FadeInDown.delay((actions.length - 1 - index) * STAGGER_MS)
                  .duration(FAST.durationMs)
                  .reduceMotion(ReduceMotion.System)}
                exiting={FadeOutDown.duration(FAST.durationMs).reduceMotion(ReduceMotion.System)}
                className={
                  cn("items-center gap-2", isStart ? "flex-row-reverse" : "flex-row") ?? ""
                }
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  className="rounded-[var(--radius-pill)] bg-surface px-3 py-1.5 shadow-sm"
                >
                  <Text type="small">{action.label}</Text>
                </View>
                <IconButton
                  label={action.label}
                  icon={action.icon}
                  variant="secondary"
                  className="rounded-[var(--radius-pill)] shadow-sm"
                  onPress={() => choose(action)}
                />
              </Animated.View>
            ))
          : null}
        {isExtended ? (
          <Button {...shared} startIcon={drawn}>
            {label}
          </Button>
        ) : (
          <IconButton {...shared} label={label} icon={drawn} />
        )}
      </View>
    </>
  );
}
