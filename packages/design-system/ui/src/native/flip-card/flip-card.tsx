/**
 * Stackra file contract:
 * Purpose: the native `FlipCard`: two faces stacked in one card that turn over in 3D with Reanimated on a press (the
 *          theme's `base` step), toward the reading end, so the turn mirrors in Arabic; each face hides its back, and
 *          the hidden face is hidden from VoiceOver and TalkBack.
 * Boundary: the card takes the front's size; the back fills it. Under reduced motion the faces swap at once. The press
 *           target is the whole card, a button whose hint is `flipLabel`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { useDirection } from "#native/bidi/use-direction";
import type { FlipCardProps } from "#native/flip-card/flip-card.props";

const BASE = motionTiming(STACKRA_THEME, "base");
/** The camera distance of the 3D turn, in points. */
const PERSPECTIVE = 1000;
/** Hidden from screen readers. */
const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

/** A card with two faces that turns over on a press. */
export function FlipCard({
  front,
  back,
  isFlipped,
  defaultFlipped,
  onFlipChange,
  flipLabel,
  axis = "horizontal",
  isDisabled = false,
  className,
  ...rest
}: FlipCardProps): ReactElement {
  const [ownFlipped, setOwnFlipped] = useState(defaultFlipped ?? false);
  const flipped = isFlipped ?? ownFlipped;
  const sign = useDirection() === "rtl" ? -1 : 1;
  const isReduced = useReducedMotion();
  const turn = useSharedValue(flipped ? 180 : 0);
  useEffect(() => {
    const to = flipped ? 180 : 0;
    turn.set(isReduced ? to : withTiming(to, { duration: BASE.durationMs }));
  }, [flipped, isReduced, turn]);
  const isY = axis === "horizontal";
  const faceStyle = (offset: number) => () => {
    "worklet";
    const angle = `${(turn.get() - offset) * sign}deg`;
    const shown = offset === 0 ? turn.get() < 90 : turn.get() >= 90;
    return {
      opacity: shown ? 1 : 0,
      transform: [{ perspective: PERSPECTIVE }, isY ? { rotateY: angle } : { rotateX: angle }],
    };
  };
  const frontStyle = useAnimatedStyle(faceStyle(0));
  const backStyle = useAnimatedStyle(faceStyle(180));

  const flip = () => {
    setOwnFlipped(!flipped);
    onFlipChange?.(!flipped);
  };
  const faces = (
    <>
      <Animated.View
        style={[{ backfaceVisibility: "hidden" }, frontStyle]}
        {...(flipped ? HIDDEN : {})}
      >
        {front}
      </Animated.View>
      <Animated.View
        style={[
          {
            backfaceVisibility: "hidden",
            position: "absolute",
            top: 0,
            bottom: 0,
            start: 0,
            end: 0,
          },
          backStyle,
        ]}
        {...(flipped ? {} : HIDDEN)}
      >
        {back}
      </Animated.View>
    </>
  );

  return isDisabled ? (
    <View {...rest} className={cn("relative", className) ?? ""}>
      {faces}
    </View>
  ) : (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityHint={flipLabel}
      accessibilityState={{ expanded: flipped }}
      onPress={flip}
      className={cn("relative", className) ?? ""}
    >
      {faces}
    </Pressable>
  );
}
