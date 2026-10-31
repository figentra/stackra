/**
 * Stackra file contract:
 * Purpose: the native `TamoButton`: the Tamo action button, a pill with a brand-gradient glow border
 *          (`--color-tamo-glow-*` through react-native-svg) and Tamo's mark, a shimmer band sweeping round the border
 *          while working, three sizes, and an icon-only form for inside fields.
 * Boundary: draws and reports presses; it runs no task. Working, it reports busy and the mark scans; under reduced
 *           motion the band and the scan stop. Other Pressable props pass through, so a Menu trigger can drive it.
 * Runtime: react-native
 * Governing contract: ADR 0507 (decisions 4 and 6); WCAG 2.2 SC 2.3.3, 2.5.8, 4.1.2.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState, type ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useCSSVariable } from "uniwind";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { SvgGradient } from "#native/scroll-area/svg-gradient";
import { TamoMark } from "#native/tamo-mark/tamo-mark";
import { Text } from "#native/text/text";
import type { TamoButtonProps } from "#native/tamo-button/tamo-button.props";

/** One sweep of the shimmer, the theme's `tamo-shimmer` step. */
const SWEEP_MS = motionTiming(STACKRA_THEME, "tamo-shimmer").durationMs;
/** The inner pill's box by size. */
const BOX = { sm: "h-7 gap-1 px-2.5", md: "h-8 gap-1.5 px-3", lg: "h-10 gap-2 px-4" } as const;
/** The icon-only box by size. */
const ICON_BOX = { sm: "size-7", md: "size-8", lg: "size-10" } as const;
/** The gradient runs from the start edge to the end edge. */
const ACROSS = { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } } as const;

/** The Tamo action button. */
export function TamoButton({
  label,
  isIconOnly = false,
  size = "md",
  status = "idle",
  isDisabled = false,
  onPress,
  className,
  ...rest
}: TamoButtonProps): ReactElement {
  const t = useUiText();
  const name = label ?? t(TAMO_KEYS.ui.tamo.ask);
  const glow = useCSSVariable([
    "--color-tamo-glow-start",
    "--color-tamo-glow-mid",
    "--color-tamo-glow-end",
  ]);
  const isWorking = status === "working";
  const isReduced = useReducedMotion();
  const isSweeping = isWorking && !isReduced;
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);
  useEffect(() => {
    if (!isSweeping || width === 0) return;
    offset.set(-width / 3);
    offset.set(
      withRepeat(withTiming(width, { duration: SWEEP_MS, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(offset);
  }, [isSweeping, width, offset]);
  const bandStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  return (
    <Pressable
      {...rest}
      testID="tamo-button"
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ busy: isWorking, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className={[
        "self-start overflow-hidden rounded-[var(--radius-pill)] p-px",
        isDisabled ? "opacity-50" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SvgGradient
        colors={glow.map((colour) => String(colour ?? ""))}
        style={StyleSheet.absoluteFill}
        {...ACROSS}
      />
      {isSweeping ? (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-y-0 w-1/3 bg-tamo-shimmer opacity-70"
          style={bandStyle}
        />
      ) : null}
      <View
        className={`flex-row items-center justify-center rounded-[var(--radius-pill)] bg-surface ${isIconOnly ? ICON_BOX[size] : BOX[size]}`}
      >
        <TamoMark size={size === "lg" ? "md" : "sm"} status={status} />
        {isIconOnly ? null : <Text type={size === "lg" ? "body" : "small"}>{name}</Text>}
      </View>
    </Pressable>
  );
}
