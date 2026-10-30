/**
 * Stackra file contract:
 * Purpose: `NativeDatePresets`, the one-day shortcuts under the native DatePicker: a wrapping row of 44-point chips
 *          that set the day; the chosen day's chip is selected, with a selection haptic on each press.
 * Boundary: internal; the words are the `ui` catalogue's, the days `dateOfPreset`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.8 and 4.1.2; STA-1371.
 */
import type { CalendarDate } from "@internationalized/date";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { DatePreset } from "#contracts/enums/date-preset.enum";
import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { dateOfPreset } from "#core/functions/date-of-preset.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";

/** The presets' keys. */
const K = DISPLAY_KEYS.ui.date_presets;

/** Draws one-day shortcut buttons such as today. */
export function NativeDatePresets({
  presets,
  today,
  chosen,
  onPick,
}: {
  readonly presets: readonly DatePreset[];
  readonly today: CalendarDate;
  readonly chosen: CalendarDate | null | undefined;
  readonly onPick: (day: CalendarDate) => void;
}): ReactElement {
  const t = useUiText();
  return (
    <View accessibilityLabel={t(K.label)} className="flex-row flex-wrap gap-2">
      {presets.map((preset) => {
        const day = dateOfPreset(preset, today);
        const isChosen = chosen?.toString() === day.toString();
        return (
          <Pressable
            key={preset}
            accessibilityRole="button"
            accessibilityState={{ selected: isChosen }}
            onPress={() => {
              haptics.play("selection");
              onPick(day);
            }}
            className={`min-h-11 justify-center rounded-[var(--radius-control)] px-3 ${isChosen ? "bg-accent-soft" : "bg-default"}`}
          >
            <Text type="small" className={isChosen ? "text-accent-soft-foreground" : ""}>
              {t(K[preset])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
