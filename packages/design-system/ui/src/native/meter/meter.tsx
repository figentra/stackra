/**
 * Stackra file contract:
 * Purpose: the native `Meter`: a label, the value in the customer's digits, and a bar coloured by `meterToneOf`
 *          (green in the optimum's part, amber one part away, red beyond).
 * Boundary: React Native has no meter role, so it is read as an adjustable-free progress bar with its value text;
 *           the colour is never the only signal. The bar fills from the reading start.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1 and 4.1.2; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { meterToneOf } from "#core/functions/meter-tone-of.function";
import { useNumberFormat } from "#native/hooks/use-number-format";
import type { MeterProps } from "#native/meter/meter.props";
import { Text } from "#native/text/text";

/** The fill colour of each tone. */
const FILL = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" } as const;

/** One measure on a scale. */
export function Meter({
  value,
  minValue = 0,
  maxValue = 100,
  low,
  high,
  optimum,
  label,
  formatOptions,
  valueLabel,
  className,
}: MeterProps): ReactElement {
  const format = useNumberFormat();
  const tone = meterToneOf(value, { minValue, maxValue, low, high, optimum });
  const share = Math.min(1, Math.max(0, (value - minValue) / (maxValue - minValue || 1)));
  const text = valueLabel ?? (formatOptions ? format(value, formatOptions) : format(share, { style: "percent" }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: minValue, max: maxValue, now: value, text }}
      className={`gap-1.5 ${className ?? ""}`}
    >
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-medium">{label}</Text>
        <Text type="small" tone="muted">
          {text}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-default">
        <View className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${share * 100}%` }} />
      </View>
    </View>
  );
}
