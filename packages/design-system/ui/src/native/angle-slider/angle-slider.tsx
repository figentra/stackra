/**
 * Stackra file contract:
 * Purpose: the native `AngleSlider`: a dial for an angle from 0 to 359 degrees. A touch or drag anywhere on the dial
 *          points the hand there; VoiceOver and TalkBack treat it as adjustable (swipe up and down one step) and hear
 *          "45 degrees" in the customer's digits; optional ticks at the quarters.
 * Boundary: react-native-svg in theme colours, the value in RN Text. The drag is React Native's PanResponder (this
 *           package has no gesture-handler dependency). Angles are absolute, so the dial is not mirrored in Arabic.
 *           The maths is the shared `angleOfPoint` and `snapAngle`. Nothing animates.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.7 and 4.1.2; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useThemeColor } from "heroui-native";
import { useState, type ReactElement } from "react";
import { PanResponder, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { angleOfPoint } from "#core/functions/angle-of-point.function";
import { snapAngle } from "#core/functions/snap-angle.function";
import type { AngleSliderProps } from "#native/angle-slider/angle-slider.props";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Text } from "#native/text/text";

/** The drawing box, the ring's radius and the quarter ticks' angles, as on web. */
const BOX = 100;
const RADIUS = 42;
const QUARTERS = [0, 90, 180, 270] as const;

/** A point on the ring at `angle` degrees clockwise from the top, at `reach` from the centre. */
const pointAt = (angle: number, reach: number) => {
  const radians = (angle * Math.PI) / 180;
  return { x: BOX / 2 + reach * Math.sin(radians), y: BOX / 2 - reach * Math.cos(radians) };
};

/** An angle set on a dial. */
export function AngleSlider({
  value,
  defaultValue = 0,
  onChange,
  step = 1,
  label,
  hasMarks = false,
  size = 160,
  isDisabled = false,
  className,
}: AngleSliderProps): ReactElement {
  const format = useNumberFormat();
  const [accent, surface, border, muted] = useThemeColor(["accent", "surface", "border", "muted"]);
  const [own, setOwn] = useState(() => snapAngle(defaultValue, step));
  const angle = value === undefined ? own : snapAngle(value, step);
  const change = (next: number) => {
    if (next === angle) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const pointTo = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    change(snapAngle(angleOfPoint(locationX - size / 2, locationY - size / 2), step));
  };
  // Made each render so the handlers see the current angle; they read only the touch's position, never the
  // responder's accumulated gesture state, so a new one mid-drag loses nothing.
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isDisabled,
    onMoveShouldSetPanResponder: () => !isDisabled,
    onPanResponderGrant: pointTo,
    onPanResponderMove: pointTo,
  });
  const tip = pointAt(angle, RADIUS);
  const grid = Math.max(1, step);
  return (
    <View className={`items-center gap-2 ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}>
      <Text className="font-medium">{label}</Text>
      <View
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityValue={{
          min: 0,
          max: 359,
          now: angle,
          text: format(angle, { style: "unit", unit: "degree", unitDisplay: "long" }),
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          if (isDisabled) return;
          const by = event.nativeEvent.actionName === "increment" ? grid : -grid;
          change(snapAngle(angle + by, grid));
        }}
        style={{ width: size, height: size }}
      >
        <Svg pointerEvents="none" width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
          <Circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={RADIUS}
            fill={surface}
            stroke={border}
            strokeWidth={6}
          />
          {hasMarks
            ? QUARTERS.map((quarter) => {
                const from = pointAt(quarter, RADIUS - 2);
                const to = pointAt(quarter, RADIUS + 2);
                return (
                  <Line
                    key={quarter}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={muted}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                );
              })
            : null}
          <Line
            x1={BOX / 2}
            y1={BOX / 2}
            x2={tip.x}
            y2={tip.y}
            stroke={accent}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Circle cx={BOX / 2} cy={BOX / 2} r={3} fill={accent} />
          <Circle cx={tip.x} cy={tip.y} r={6} fill={accent} />
        </Svg>
      </View>
      <Text
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="font-semibold tabular-nums"
      >
        {format(angle, { style: "unit", unit: "degree", unitDisplay: "narrow" })}
      </Text>
    </View>
  );
}
