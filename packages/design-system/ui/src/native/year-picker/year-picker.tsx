/**
 * Stackra file contract:
 * Purpose: the native `YearPicker`: a three-column grid of years, the chosen one filled and this year in the accent;
 *          in the Hijri option each year also shows the Hijri years it spans.
 * Boundary: each year is a radio button read by its number; a selection haptic on each choice. Digits are the
 *           customer's.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192; WCAG 2.2
 *          SC 4.1.2.
 */
import { withDigits } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { hijriYearsOf } from "#core/functions/hijri-years-of.function";
import { yearsBetween } from "#core/functions/years-between.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";
import type { YearPickerProps } from "#native/year-picker/year-picker.props";

/** A grid of years. */
export function YearPicker({
  value,
  defaultValue,
  onChange,
  minYear,
  maxYear,
  calendar = "gregory",
  label,
  isDisabled,
  className,
}: YearPickerProps): ReactElement {
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const t = useUiText();
  const [thisYear] = useState(() => new Date().getFullYear());
  const [own, setOwn] = useState(defaultValue ?? null);
  const year = value === undefined ? own : value;
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label ?? t(FORMS_KEYS.ui.year_picker.label)}
      className={`flex-row flex-wrap ${className ?? ""}`}
    >
      {yearsBetween(minYear ?? thisYear - 10, maxYear ?? thisYear + 10).map((each) => {
        const isChosen = each === year;
        return (
          <View key={each} className="w-1/3 p-1">
            <Pressable
              disabled={Boolean(isDisabled)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isChosen, disabled: Boolean(isDisabled) }}
              onPress={() => {
                haptics.play("selection");
                if (value === undefined) setOwn(each);
                onChange?.(each);
              }}
              className={`min-h-11 items-center justify-center rounded-[var(--radius-control)] ${isChosen ? "bg-accent" : "bg-default"} ${isDisabled ? "opacity-50" : ""}`}
            >
              <Text
                tone={isChosen ? "default" : each === thisYear ? "accent" : "default"}
                className={isChosen ? "font-semibold text-accent-foreground" : ""}
              >
                {withDigits(number.format(each), numerals)}
              </Text>
              {calendar === "islamic-umalqura" ? (
                <Text
                  type="caption"
                  tone="muted"
                  className={isChosen ? "text-accent-foreground" : ""}
                >
                  {withDigits(hijriYearsOf(each, locale), numerals)}
                </Text>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
