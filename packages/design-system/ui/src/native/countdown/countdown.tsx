/**
 * Stackra file contract:
 * Purpose: the native `Countdown`: a countdown to `to` or a stopwatch from `from`, as days (when there are any) and
 *          hh:mm:ss in the customer's digits, ticking once a second.
 * Boundary: read as one element, its label and the time in words; a polite announcement once a minute and "Time is up"
 *           at the end (`AccessibilityInfo`). The digits keep left-to-right order in Arabic; nothing animates.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits); WCAG 2.2 SC 4.1.3; STA-1371.
 */
import { use, useEffect, type ReactElement } from "react";
import { AccessibilityInfo, View } from "react-native";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { clockPartsOf } from "#core/functions/clock-parts-of.function";
import { spokenDurationOf } from "#core/functions/spoken-duration-of.function";
import { useClock } from "#react/hooks/use-clock";
import { useUiText } from "#react/hooks/use-ui-text";
import type { CountdownProps } from "#native/countdown/countdown.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Text } from "#native/text/text";

/** The countdown's keys. */
const K = DISPLAY_KEYS.ui.countdown;

/** A countdown or a stopwatch. */
export function Countdown(props: CountdownProps): ReactElement {
  const { mode = "countdown", label, className } = props;
  const t = useUiText();
  const format = useNumberFormat();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const ms = useClock(props);
  const parts = clockPartsOf(ms);
  const two = (value: number) => format(value, { minimumIntegerDigits: 2, useGrouping: false });
  const isDone = mode === "countdown" && ms === 0;
  const spoken = isDone
    ? t(K.done)
    : t(mode === "countdown" ? K.left : K.elapsed, {
        time: spokenDurationOf({ ...parts, seconds: 0 }, format, locale),
      });
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(spoken);
  }, [spoken]);
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${label}, ${spoken}`}
      className={`gap-1 ${className ?? ""}`}
    >
      <Text type="small" tone="muted">
        {label}
      </Text>
      <View className="flex-row items-baseline gap-2" style={{ direction: "ltr" }}>
        {parts.days > 0 ? (
          <Text className="text-2xl font-semibold">
            {format(parts.days, { style: "unit", unit: "day", unitDisplay: "narrow" })}
          </Text>
        ) : null}
        <Text className="text-2xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
          {`${two(parts.hours)}:${two(parts.minutes)}:${two(parts.seconds)}`}
        </Text>
      </View>
    </View>
  );
}
