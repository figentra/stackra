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
import { useNumerals } from "@stackra/i18n/react";
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { usePeriodPickerState } from "#react/hooks/use-period-picker-state";
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
  presets,
  showComparison = true,
  today,
  isDisabled,
  className,
}: PeriodPickerProps): ReactElement {
  const t = useUiText();
  const K = UI_KEYS.ui.period_picker;
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const {
    period,
    preset,
    mode,
    versus,
    presetItems,
    modeItems,
    choosePreset,
    chooseRange,
    setCompare,
    chooseMode,
  } = usePeriodPickerState({ value, defaultValue, onChange, presets, today }, locale, numerals);
  return (
    <View accessibilityLabel={label ?? t(K.label)} className={className ?? "gap-3"}>
      <Select
        label={t(K.preset)}
        isFullWidth
        isDisabled={isDisabled}
        value={preset}
        items={presetItems}
        onChange={choosePreset}
      />
      {preset === "custom" ? (
        <DateRangePicker
          label={t(K.dates)}
          presets={[]}
          isDisabled={isDisabled}
          value={period.range}
          onChange={chooseRange}
        />
      ) : null}
      {showComparison ? (
        <>
          <Switch
            label={t(K.compare)}
            description={versus}
            isDisabled={isDisabled}
            value={mode !== null}
            onChange={setCompare}
          />
          {mode === null ? null : (
            <Select
              label={t(K.mode)}
              isFullWidth
              isDisabled={isDisabled}
              value={mode}
              items={modeItems}
              onChange={chooseMode}
            />
          )}
        </>
      ) : null}
    </View>
  );
}
