/**
 * Stackra file contract:
 * Purpose: the web `PeriodPicker`, a dashboard's period control in one wrapping row: a Select of preset periods
 *          ("Last 30 days", "This quarter") and "Custom range", which shows a DateRangePicker beside it; and a
 *          "Compare to previous period" Switch whose description reads the comparison range ("vs 1–30 Sep 2026"),
 *          with a Select of the mode (previous period or same period last year) while it is on.
 * Boundary: built from the kit's Select, DateRangePicker and Switch, so focus, keys, popovers and motion are theirs
 *           (React Aria; the Switch thumb follows the reading direction and reduced motion). Controlled or not; every
 *           change hands `onChange` the whole value from `periodOf`. Dates are written in React Aria's locale with
 *           the customer's digits.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1,
 *          2.1.1 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import { useNumerals } from "@stackra/i18n/react";
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { DateRangePicker } from "#react/date-range-picker/date-range-picker";
import { usePeriodPickerState } from "#react/hooks/use-period-picker-state";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PeriodPickerProps } from "#react/period-picker/period-picker.props";
import { Select } from "#react/select/select";
import { Switch } from "#react/switch/switch";

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
  const { locale } = useLocale();
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
    <div
      role="group"
      aria-label={label ?? t(K.label)}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
    >
      <Select
        aria-label={t(K.preset)}
        className="w-44"
        isDisabled={isDisabled}
        value={preset}
        items={presetItems}
        onChange={choosePreset}
      />
      {preset === "custom" ? (
        <DateRangePicker
          aria-label={t(K.dates)}
          isFullWidth={false}
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
              aria-label={t(K.mode)}
              className="w-52"
              isDisabled={isDisabled}
              value={mode}
              items={modeItems}
              onChange={chooseMode}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
