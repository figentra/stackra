/**
 * Stackra file contract:
 * Purpose: the native `MorphButton`: one button that morphs with its action's state. `idle` shows its label; `loading`
 *          narrows to a circle with a spinner; `success` tints green with a check, then settles back to the label after
 *          `successDuration`; `error` tints the danger colour, shakes once and shows the error words. Reanimated carries
 *          the width (a layout transition), the tint (a timed opacity) and the icon cross-fade; each state's words are
 *          announced to VoiceOver and TalkBack.
 * Boundary: builds on `#native/button/button`, so variants, sizes, haptics and the busy state are the Button's.
 *           Motion follows `useMotion`: `full` animates and shakes, `reduced` keeps the fades, `none` snaps. Presses
 *           reach `onPress` only while `idle` or `error`. The row follows the reading direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.3.3, 4.1.3.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { Button as HeroButton, Spinner, cn, useThemeColor } from "heroui-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { MorphButtonState } from "#contracts/enums/morph-button-state.enum";
import { Button } from "#native/button/button";
import { useMotion } from "#native/design-system-provider/use-motion";
import { Icon } from "#native/icon/icon";
import type { MorphButtonProps } from "#native/morph-button/morph-button.props";

const BASE = motionTiming(STACKRA_THEME, "base");
/** One leg of the error shake, in ms. */
const LEG = { duration: 50 } as const;

/** A button that narrows to a spinner, then to a check, or shakes into its error words. */
export function MorphButton({
  state = "idle",
  labels,
  onPress,
  successDuration = 1500,
  onSuccessEnd,
  variant = "primary",
  size = "md",
  isDisabled,
  className,
  ...rest
}: MorphButtonProps): ReactElement {
  const motion = useMotion();
  const [settledFor, setSettledFor] = useState<MorphButtonState>();
  const shown = state === "success" && settledFor === "success" ? "idle" : state;
  const words = labels[shown] ?? labels.idle;
  const isRound = shown === "loading" || shown === "success";
  const takesPress = shown === "idle" || shown === "error";
  const isSolid = variant === "primary" || variant === "danger";
  const ink = useThemeColor(
    variant === "primary"
      ? "accent-foreground"
      : variant === "danger"
        ? "danger-foreground"
        : "foreground",
  );

  const tint = useSharedValue(0);
  const offset = useSharedValue(0);
  const tintStyle = useAnimatedStyle(() => ({ opacity: tint.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  useEffect(() => {
    const isTinted = isSolid && (shown === "success" || shown === "error");
    tint.set(
      motion === "none"
        ? Number(isTinted)
        : withTiming(Number(isTinted), { duration: BASE.durationMs }),
    );
    if (shown === "error" && motion === "full")
      offset.set(
        withSequence(
          withTiming(-6, LEG),
          withTiming(6, LEG),
          withTiming(-4, LEG),
          withTiming(4, LEG),
          withTiming(0, LEG),
        ),
      );
  }, [shown, motion, isSolid, tint, offset]);

  useEffect(() => {
    if (state !== "success") return undefined;
    const timer = setTimeout(() => {
      setSettledFor("success");
      onSuccessEnd?.();
    }, successDuration);
    return () => {
      clearTimeout(timer);
      setSettledFor(undefined);
    };
  }, [state, successDuration, onSuccessEnd]);

  const previous = useRef(shown);
  useEffect(() => {
    if (previous.current !== shown && shown !== "idle")
      AccessibilityInfo.announceForAccessibility(words);
    previous.current = shown;
  }, [shown, words]);

  const fades =
    motion === "none"
      ? {}
      : { entering: FadeIn.duration(BASE.durationMs), exiting: FadeOut.duration(BASE.durationMs) };

  return (
    <Animated.View
      {...(motion === "full" ? { layout: LinearTransition.duration(BASE.durationMs) } : {})}
      style={shakeStyle}
      className="self-start"
    >
      <Button
        {...rest}
        variant={!isSolid && shown === "error" ? "danger-soft" : variant}
        size={size}
        label={words}
        className={
          cn("overflow-hidden", isRound && "aspect-square rounded-full px-0", className) || ""
        }
        accessibilityState={{ busy: shown === "loading" }}
        {...(isDisabled === undefined ? {} : { isDisabled })}
        {...(takesPress && onPress ? { onPress } : {})}
      >
        {/* The tint sits under the content and fades in over the variant's colour. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, tintStyle]}
          className={shown === "success" ? "bg-success" : "bg-danger"}
        />
        {isRound ? (
          <Animated.View key={shown} {...fades}>
            {shown === "loading" ? <Spinner size="sm" color={ink} /> : <Icon name="check" />}
          </Animated.View>
        ) : (
          <Animated.View key={shown} {...fades}>
            <HeroButton.Label>{words}</HeroButton.Label>
          </Animated.View>
        )}
      </Button>
    </Animated.View>
  );
}
