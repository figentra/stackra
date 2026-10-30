/**
 * Stackra file contract:
 * Purpose: the native `SlideToConfirm`: a pill track whose round thumb the person drags to the reading end; a fill
 *          follows the thumb and the instruction fades as it goes. Past nine tenths it locks at the end, plays the
 *          success haptic and confirms; short of that it springs back. VoiceOver and TalkBack confirm with the
 *          default activate action (a double tap), which is also the single-pointer alternative of WCAG 2.5.7.
 * Boundary: the drag is React Native's PanResponder driving Reanimated values (this package has no gesture-handler
 *           dependency); it claims only clearly horizontal drags. Directions follow `useDirection`, so in Arabic the
 *           thumb starts on the right and slides left. Reduced motion drops the spring.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.5.7.
 */
import { cn, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { PanResponder, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { useDirection } from "#native/bidi/use-direction";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import type { SlideToConfirmProps } from "#native/slide-to-confirm/slide-to-confirm.props";
import { Text } from "#native/text/text";

/** The thumb's size and the track's inner padding, in points. */
const THUMB = 48;
const PAD = 4;
/** The share of the travel that confirms on release. */
const CONFIRM_SHARE = 0.9;

/** A thumb the person slides to the end to confirm a weighty action. */
export function SlideToConfirm({
  label,
  confirmedLabel,
  onConfirm,
  isConfirmed,
  variant = "primary",
  isDisabled = false,
  className,
  ...rest
}: SlideToConfirmProps): ReactElement {
  const [ownConfirmed, setOwnConfirmed] = useState(false);
  const confirmed = isConfirmed ?? ownConfirmed;
  const sign = useDirection() === "rtl" ? -1 : 1;
  const isReduced = useReducedMotion();
  const [fill, onFill] = useThemeColor(
    variant === "danger" ? ["danger", "danger-foreground"] : ["accent", "accent-foreground"],
  );
  // How far the thumb has gone toward the reading end, and how far it can go, in points.
  const offset = useSharedValue(0);
  const travel = useSharedValue(0);

  useEffect(() => {
    const to = confirmed ? travel.get() : 0;
    offset.set(isReduced ? to : withSpring(to));
  }, [confirmed, isReduced, offset, travel]);

  const confirm = () => {
    if (confirmed || isDisabled) return;
    haptics.play("success");
    setOwnConfirmed(true);
    onConfirm?.();
  };

  const responder = useMemo(() => {
    const isLocked = isDisabled || confirmed;
    const settle = () => {
      offset.set(isReduced ? 0 : withSpring(0));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !isLocked,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        !isLocked && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_event, gesture) => {
        offset.set(Math.min(Math.max(gesture.dx * sign, 0), travel.get()));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dx * sign < travel.get() * CONFIRM_SHARE) return settle();
        offset.set(travel.get());
        confirm();
        return undefined;
      },
      onPanResponderTerminate: settle,
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `confirm` reads the same state as the deps below.
  }, [isDisabled, confirmed, isReduced, sign, offset, travel]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() * sign }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: offset.get() + THUMB + PAD * 2 }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(offset.get() / Math.max(travel.get(), 1), 1),
  }));
  const words = confirmed ? (confirmedLabel ?? label) : label;

  return (
    <View
      {...rest}
      accessible
      accessibilityRole="button"
      accessibilityLabel={words}
      accessibilityState={{ disabled: isDisabled, checked: confirmed }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate") confirm();
      }}
      onLayout={(event) => {
        travel.set(Math.max(event.nativeEvent.layout.width - THUMB - PAD * 2, 0));
      }}
      className={
        cn(
          "h-14 justify-center overflow-hidden rounded-full bg-default",
          isDisabled && "opacity-50",
          className,
        ) ?? ""
      }
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            start: 0,
            opacity: 0.25,
            backgroundColor: fill,
          },
          fillStyle,
        ]}
        className="rounded-full"
      />
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", start: THUMB + PAD * 2, end: PAD * 4 }, labelStyle]}
      >
        <Text className="text-center font-medium" numberOfLines={1}>
          {words}
        </Text>
      </Animated.View>
      <Animated.View
        {...responder.panHandlers}
        style={[
          {
            width: THUMB,
            height: THUMB,
            marginStart: PAD,
            borderRadius: THUMB / 2,
            backgroundColor: fill,
          },
          thumbStyle,
        ]}
        className="items-center justify-center"
      >
        <LucideProvider color={onFill}>
          <Icon name={confirmed ? "check" : "chevrons-right"} />
        </LucideProvider>
      </Animated.View>
    </View>
  );
}
