/**
 * Stackra file contract:
 * Purpose: the native `TimeClock`: a time of day picked on an analogue face. The time above it names the hours and
 *          the minutes (tap one to set it) and, in a 12-hour cycle, AM and PM. A touch or drag on the face picks the
 *          nearest hour (24-hour: the inner ring is 00 and 13 to 23) or minute step, and lifting the finger on the
 *          hours moves to the minutes. VoiceOver and TalkBack treat the face as adjustable (one step per swipe) and
 *          hear the whole time ("3:45 PM").
 * Boundary: react-native-svg in theme colours; the numerals are SVG Text shaped by the platform (never Skia), in the
 *           customer's digits through `clockFaceOf`. The face is never mirrored (clocks run clockwise in Arabic too)
 *           and the time above reads hours then minutes, left to right. The drag is PanResponder. Nothing animates.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.7 and 4.1.2; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useNumerals } from "@stackra/i18n/react";
import { useThemeColor } from "heroui-native";
import { useState, type ReactElement } from "react";
import { PanResponder, Pressable, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

import type { ClockView } from "#contracts/types/clock-view.type";
import type { TimeValue } from "#contracts/types/time-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { angleOfPoint } from "#core/functions/angle-of-point.function";
import { clockFaceOf } from "#core/functions/clock-face-of.function";
import { clockTimeTextOf } from "#core/functions/clock-time-text-of.function";
import { dayPeriodsOf } from "#core/functions/day-periods-of.function";
import { hourCycleOf } from "#core/functions/hour-cycle-of.function";
import { stepClockTime } from "#core/functions/step-clock-time.function";
import { timeOfClockAngle } from "#core/functions/time-of-clock-angle.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Text } from "#native/text/text";
import type { TimeClockProps } from "#native/time-clock/time-clock.props";

/** The drawing box, the face's radius, the numeral rings and the knob's radius, as on web; the face's size. */
const BOX = 200;
const FACE = 98;
const OUTER = 80;
const INNER = 52;
const KNOB = 16;
const SIZE = 256;

/** A point at `angle` degrees clockwise from the top, at `reach` from the centre. */
const pointAt = (angle: number, reach: number) => {
  const radians = (angle * Math.PI) / 180;
  return { x: BOX / 2 + reach * Math.sin(radians), y: BOX / 2 - reach * Math.cos(radians) };
};

/** The chosen part is in the accent, the other muted. */
const toneOf = (isOn: boolean): "accent" | "muted" => (isOn ? "accent" : "muted");

/** A time of day on a clock face. */
export function TimeClock({
  value,
  defaultValue,
  onChange,
  minuteStep = 1,
  hourCycle,
  label,
  isDisabled = false,
  className,
}: TimeClockProps): ReactElement {
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const format = useNumberFormat();
  const t = useUiText();
  const K = FORMS_KEYS.ui.wheel;
  const [accent, onAccent, face, foreground, muted] = useThemeColor([
    "accent",
    "accent-foreground",
    "default",
    "foreground",
    "muted",
  ]);
  const cycle = hourCycle ?? hourCycleOf(locale);
  const [view, setView] = useState<ClockView>("hours");
  const [own, setOwn] = useState<TimeValue>(() => defaultValue ?? { hour: 12, minute: 0 });
  const time = value ?? own;
  const change = (next: TimeValue) => {
    if (next.hour === time.hour && next.minute === time.minute) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const drawn = clockFaceOf(time, view, cycle, format);
  const knob = pointAt(drawn.hand.angle, drawn.hand.isInner ? INNER : OUTER);
  const two = { minimumIntegerDigits: 2, useGrouping: false } as const;
  const hourText =
    cycle === 12 ? format(time.hour % 12 === 0 ? 12 : time.hour % 12) : format(time.hour, two);
  const isPm = time.hour >= 12;

  const pointTo = (event: GestureResponderEvent) => {
    const scale = BOX / SIZE;
    const dx = event.nativeEvent.locationX * scale - BOX / 2;
    const dy = event.nativeEvent.locationY * scale - BOX / 2;
    const isInner = cycle === 24 && Math.hypot(dx, dy) < (OUTER + INNER) / 2;
    change(
      timeOfClockAngle(angleOfPoint(dx, dy), {
        view,
        value: time,
        hourCycle: cycle,
        isInner,
        minuteStep,
      }),
    );
  };
  // Made each render so the handlers see the current time and face; they read only the touch's position, never the
  // responder's accumulated gesture state, so a new one mid-drag loses nothing.
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isDisabled,
    onMoveShouldSetPanResponder: () => !isDisabled,
    onPanResponderGrant: pointTo,
    onPanResponderMove: pointTo,
    onPanResponderRelease: () => {
      if (view === "hours") setView("minutes");
    },
  });
  return (
    <View className={`items-center gap-3 ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}>
      {label ? <Text className="font-medium">{label}</Text> : null}
      <View style={{ direction: "ltr" }} className="flex-row items-center gap-1">
        {(["hours", "minutes"] as const).map((which) => (
          <View key={which} className="flex-row items-center gap-1">
            {which === "minutes" ? <Text className="text-3xl font-semibold">:</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(which === "hours" ? K.hour : K.minute)}
              accessibilityState={{ selected: view === which, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => setView(which)}
              className="px-2 py-1"
            >
              <Text className="text-3xl font-semibold tabular-nums" tone={toneOf(view === which)}>
                {which === "hours" ? hourText : format(time.minute, two)}
              </Text>
            </Pressable>
          </View>
        ))}
        {cycle === 12 ? (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t(K.period)}
            className="ms-2 gap-0.5"
          >
            {dayPeriodsOf(locale).map((period, index) => {
              const isOn = isPm === (index === 1);
              return (
                <Pressable
                  key={period}
                  accessibilityRole="radio"
                  accessibilityLabel={period}
                  accessibilityState={{ checked: isOn, disabled: isDisabled }}
                  disabled={isDisabled}
                  onPress={() =>
                    change({ hour: (time.hour % 12) + (index === 1 ? 12 : 0), minute: time.minute })
                  }
                  className="px-1.5 py-0.5"
                >
                  <Text type="small" tone={toneOf(isOn)} className="font-semibold">
                    {period}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
      <View
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t(view === "hours" ? K.hour : K.minute)}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityValue={{
          min: 0,
          max: view === "hours" ? 23 : 59,
          now: view === "hours" ? time.hour : time.minute,
          text: clockTimeTextOf(time, locale, cycle, numerals),
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          if (isDisabled) return;
          const by = event.nativeEvent.actionName === "increment" ? 1 : -1;
          change(stepClockTime(time, view, by, minuteStep));
        }}
        style={{ width: SIZE, height: SIZE }}
      >
        <Svg pointerEvents="none" width={SIZE} height={SIZE} viewBox={`0 0 ${BOX} ${BOX}`}>
          <Circle cx={BOX / 2} cy={BOX / 2} r={FACE} fill={face} />
          <Line x1={BOX / 2} y1={BOX / 2} x2={knob.x} y2={knob.y} stroke={accent} strokeWidth={2} />
          <Circle cx={BOX / 2} cy={BOX / 2} r={3} fill={accent} />
          <Circle cx={knob.x} cy={knob.y} r={KNOB} fill={accent} />
          {drawn.numerals.map((numeral) => {
            const at = pointAt(numeral.angle, numeral.isInner ? INNER : OUTER);
            return (
              <SvgText
                key={`${numeral.isInner ? "inner" : "outer"}-${numeral.angle}`}
                x={at.x}
                y={at.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={numeral.isInner ? 11 : 14}
                fill={numeral.isSelected ? onAccent : numeral.isInner ? muted : foreground}
              >
                {numeral.text}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}
