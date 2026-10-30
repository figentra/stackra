/**
 * Stackra file contract:
 * Purpose: the native `ProgressButton`: the Button with a translucent fill that grows from the reading start as
 *          `progress` rises (the theme's `fast` step per change), busy and refusing presses below 1, and reporting the
 *          percentage to VoiceOver and TalkBack as its value.
 * Boundary: builds on `#native/button/button` (its spinner and press haptic included); the fill is a sibling over the
 *           button with `pointerEvents="none"`, clipped by a rounded wrapper. Reduced motion jumps the fill.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn, useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { Button } from "#native/button/button";
import type { ProgressButtonProps } from "#native/progress-button/progress-button.props";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** A button that fills as its action runs. */
export function ProgressButton({
  progress,
  progressLabel,
  variant = "primary",
  isFullWidth,
  label,
  children,
  className,
  ...rest
}: ProgressButtonProps): ReactElement {
  const value = progress === undefined ? 0 : Math.min(Math.max(progress, 0), 1);
  const isRunning = progress !== undefined && value < 1;
  const isFilled = variant === "primary" || variant === "danger";
  const fill = useThemeColor(
    isFilled ? (variant === "danger" ? "danger-foreground" : "accent-foreground") : "accent",
  );
  const isReduced = useReducedMotion();
  const share = useSharedValue(value);
  useEffect(() => {
    share.set(isReduced ? value : withTiming(value, { duration: FAST.durationMs }));
  }, [value, isReduced, share]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${share.get() * 100}%` }));
  const name = label ?? (typeof children === "string" ? children : undefined);

  return (
    <View
      className={
        cn(
          "relative overflow-hidden rounded-[var(--radius-pill)]",
          isFullWidth ? "self-stretch" : "self-start",
          className,
        ) ?? ""
      }
    >
      <Button
        {...rest}
        variant={variant}
        isLoading={isRunning}
        {...(isFullWidth === undefined ? {} : { isFullWidth })}
        {...(name === undefined ? {} : { label: name })}
        {...(progress === undefined
          ? {}
          : {
              accessibilityValue: {
                min: 0,
                max: 100,
                now: Math.round(value * 100),
                text: `${progressLabel ?? name ?? ""} ${Math.round(value * 100)}%`.trim(),
              },
            })}
      >
        {children}
      </Button>
      {progress === undefined ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              start: 0,
              opacity: 0.22,
              backgroundColor: fill,
            },
            fillStyle,
          ]}
        />
      )}
    </View>
  );
}
