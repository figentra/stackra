/**
 * Stackra file contract:
 * Purpose: the native `NumberPad`: a display row (the amount, or one dot per PIN digit) over a 3 by 4 keypad of
 *          PressFeedback keys (1 to 9, then the decimal key or a blank, 0 and delete), each key playing the selection
 *          haptic. A PIN reports itself complete at full length, and the display announces how many digits are in.
 * Boundary: the editing rules are `nextPadValue` in core, shared with web. The keypad keeps the phone order left to
 *           right in every language, as POS terminals and system keypads do; the page around it still mirrors. The
 *           digits are Latin.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); ADR 0060 (RTL
 *          and Arabic).
 */
import { cn } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { nextPadValue } from "#core/functions/next-pad-value.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import type { NumberPadProps } from "#native/number-pad/number-pad.props";
import { PressFeedback } from "#native/press-feedback/press-feedback";
import { Text } from "#native/text/text";

/** The keys, row by row; the decimal key is a blank cell unless asked for. */
const ROWS = Object.freeze([
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "delete"],
]);

/** A keypad for amounts, quantities and PINs. */
export function NumberPad({
  value,
  defaultValue,
  onChange,
  maxLength,
  isPin = false,
  onComplete,
  hasDecimal = false,
  label,
  deleteLabel,
  isDisplayHidden = false,
  isDisabled = false,
  className,
  ...rest
}: NumberPadProps): ReactElement {
  const t = useUiText();
  const [ownValue, setOwnValue] = useState(defaultValue ?? "");
  const current = value ?? ownValue;
  const limit = maxLength ?? (isPin ? 4 : undefined);
  const decimal = hasDecimal && !isPin;

  const press = (key: string) => {
    const next = nextPadValue(current, key, { maxLength: limit, hasDecimal: decimal });
    if (next === undefined) return;
    haptics.play("selection");
    setOwnValue(next);
    onChange?.(next);
    if (key !== "delete" && limit !== undefined && next.length === limit) onComplete?.(next);
  };

  return (
    <View {...rest} accessibilityLabel={label} className={cn("gap-4", className) ?? ""}>
      {isDisplayHidden ? null : isPin ? (
        <View
          accessible
          accessibilityLabel={label}
          accessibilityValue={{ min: 0, max: limit ?? 4, now: current.length }}
          accessibilityLiveRegion="polite"
          className="flex-row justify-center gap-3"
        >
          {Array.from({ length: limit ?? 4 }, (_, index) => (
            <View
              key={index}
              className={
                cn(
                  "size-3.5 rounded-[var(--radius-pill)] border border-foreground",
                  index < current.length && "bg-foreground",
                ) ?? ""
              }
            />
          ))}
        </View>
      ) : (
        <View
          accessible
          accessibilityLabel={`${label}: ${current || "0"}`}
          className="items-center"
        >
          <Text className="text-4xl font-semibold" style={{ writingDirection: "ltr" }}>
            {current || "0"}
          </Text>
        </View>
      )}
      <View style={{ direction: "ltr" }} className="gap-2">
        {ROWS.map((row) => (
          <View key={row.join()} className="flex-row gap-2">
            {row.map((key) => {
              if (key === "." && !decimal) return <View key={key} className="h-14 flex-1" />;
              const name =
                key === "delete"
                  ? (deleteLabel ?? t(UI_KEYS.ui.number_pad.delete))
                  : key === "."
                    ? t(UI_KEYS.ui.number_pad.decimal)
                    : key;
              return (
                <PressFeedback
                  key={key}
                  label={name}
                  isDisabled={isDisabled}
                  onPress={() => press(key)}
                  className={
                    cn(
                      "h-14 flex-1 items-center justify-center rounded-[var(--radius-container)]",
                      key === "delete" ? "bg-transparent" : "bg-default",
                      isDisabled && "opacity-50",
                    ) ?? ""
                  }
                >
                  {key === "delete" ? (
                    <Icon name="delete" isMirroredInRtl={false} />
                  ) : (
                    <Text className="text-2xl font-medium">{key}</Text>
                  )}
                </PressFeedback>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
