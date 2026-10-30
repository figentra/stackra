/**
 * Stackra file contract:
 * Purpose: the native `BarList`: ranked rows, each a soft bar from the reading start sized against the largest value,
 *          the label over the bar and the value at the end, in the customer's digits.
 * Boundary: each row is read as one element, "label, value"; the bar is decoration and grows from the right in
 *           right-to-left (it is placed with `start`). `href` is web only and ignored here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { barListRowsOf } from "#core/functions/bar-list-rows-of.function";
import type { BarListProps } from "#native/bar-list/bar-list.props";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Text } from "#native/text/text";

/** Ranked labels with bars. */
export function BarList({
  items,
  label,
  valueFormat,
  max,
  sort = "descending",
  className,
}: BarListProps): ReactElement {
  const format = useNumberFormat();
  return (
    <View
      accessibilityRole="list"
      accessibilityLabel={label}
      className={`gap-1.5 ${className ?? ""}`}
    >
      {barListRowsOf(items, sort, max).map((row) => {
        const value = format(row.value, valueFormat);
        return (
          <View
            key={row.key}
            accessible
            accessibilityLabel={`${row.label}, ${value}`}
            className="flex-row items-center gap-3"
          >
            <View className="flex-1 justify-center">
              <View
                className="absolute inset-y-0 start-0 rounded-[var(--radius-control)] bg-accent-soft"
                style={{ width: `${row.share * 100}%` }}
              />
              <Text numberOfLines={1} className="px-2 py-1.5">
                {row.label}
              </Text>
            </View>
            <Text className="font-medium">{value}</Text>
          </View>
        );
      })}
    </View>
  );
}
