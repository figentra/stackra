/**
 * Stackra file contract:
 * Purpose: the native `PeriodPicker`, a dashboard's period control stacked for a phone: a Select of preset periods
 *          and "Custom range", which adds a DateRangePicker under it; then the "Compare to previous period" Switch,
 *          its description reading the comparison range, and a Select of the mode while it is on.
 * Boundary: built from the kit's native Select, DateRangePicker and Switch, so sheets, presses, haptics and motion are
 *           theirs (they follow Reduce Motion and the reading direction). Controlled or not; every change hands
 *           `onChange` the whole value from `periodOf`, as on the web. Dates are written in the provider's locale with
 *           the customer's digits.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.2;
 *          STA-1371.
 */
import { getLocalTimeZone, today as todayIn } from "@internationalized/date";
import { withDigits } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { type ReactElement, useState } from "react";
import { View } from "react-native";

import { PeriodCompareMode } from "#contracts/enums/period-compare-mode.enum";
import type { PeriodValue } from "#contracts/types/period-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { PERIOD_PRESETS } from "#core/constants/period-presets.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { formatDateRange } from "#core/functions/format-date-range.function";
import { periodOf } from "#core/functions/period-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { DateRangePicker } from "#native/date-range-picker/date-range-picker";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { PeriodPickerProps } from "#native/period-picker/period-picker.props";
import { Select } from "#native/select/select";
import { Switch } from "#native/switch/switch";

/** A dashboard period, its presets and its comparison. */
export function PeriodPicker({
  label,
  value,
  defaultValue,
  onChange,
  presets = PERIOD_PRESETS,
  showComparison = true,
  today,
  isDisabled,
  className,
}: PeriodPickerProps): ReactElement {
  const t = useUiText();
  const K = UI_KEYS.ui.period_picker;
  const P = FORMS_KEYS.ui.date_range_picker;
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const from = today ?? todayIn(getLocalTimeZone());
  const [own, setOwn] = useState<PeriodValue>(
    () => defaultValue ?? periodOf("last_30_days", dateRangeOfPreset("last_30_days", from), null),
  );
  const period = value ?? own;
  const preset = period.preset ?? "custom";
  const mode = period.compare?.mode ?? null;
  const change = (next: PeriodValue) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const versus = period.compare
    ? t(K.versus, { range: withDigits(formatDateRange(period.compare.range, locale), numerals) })
    : undefined;
  return (
    <View accessibilityLabel={label ?? t(K.label)} className={className ?? "gap-3"}>
      <Select
        label={t(K.preset)}
        isFullWidth
        isDisabled={isDisabled}
        value={preset}
        items={[
          ...presets.map((id) => ({ id, label: t(P[id]) })),
          { id: "custom", label: t(K.custom) },
        ]}
        onChange={(id) => {
          if (!id) return;
          const picked = presets.find((item) => item === id);
          change(
            picked
              ? periodOf(picked, dateRangeOfPreset(picked, from), mode)
              : periodOf("custom", period.range, mode),
          );
        }}
      />
      {preset === "custom" ? (
        <DateRangePicker
          label={t(K.dates)}
          presets={[]}
          isDisabled={isDisabled}
          value={period.range}
          onChange={(range) => {
            if (range) change(periodOf("custom", range, mode));
          }}
        />
      ) : null}
      {showComparison ? (
        <>
          <Switch
            label={t(K.compare)}
            description={versus}
            isDisabled={isDisabled}
            value={mode !== null}
            onChange={(isOn) => change(periodOf(preset, period.range, isOn ? "previous" : null))}
          />
          {mode === null ? null : (
            <Select
              label={t(K.mode)}
              isFullWidth
              isDisabled={isDisabled}
              value={mode}
              items={PeriodCompareMode.map((id) => ({ id, label: t(K[id]) }))}
              onChange={(id) => {
                const next = PeriodCompareMode.find((item) => item === id);
                if (next) change(periodOf(preset, period.range, next));
              }}
            />
          )}
        </>
      ) : null}
    </View>
  );
}
