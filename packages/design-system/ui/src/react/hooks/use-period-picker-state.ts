/**
 * Stackra file contract:
 * Purpose: `usePeriodPickerState(props, locale, numerals)`, the state every runtime's PeriodPicker shares: the period
 *          (controlled or its own, the last 30 days by default), its preset ("custom" when it has none), the comparison
 *          mode and its "vs" sentence, the preset and mode choices in the reader's words, and the changes the controls
 *          make. A preset keeps the comparison mode; a custom range keeps it too; turning the comparison on picks the
 *          previous period.
 * Boundary: a React hook with no rendering; every change hands `onChange` the whole value from `periodOf`. The web and
 *           native PeriodPicker both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); STA-1371.
 */
import { getLocalTimeZone, today as todayIn } from "@internationalized/date";
import { withDigits, type NumberingSystem } from "@stackra/i18n";
import { useState } from "react";

import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import { PeriodCompareMode } from "#contracts/enums/period-compare-mode.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import type { PeriodPickerContractProps } from "#contracts/types/period-picker-contract-props.type";
import type { PeriodValue } from "#contracts/types/period-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { PERIOD_PRESETS } from "#core/constants/period-presets.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { formatDateRange } from "#core/functions/format-date-range.function";
import { periodOf } from "#core/functions/period-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The picker's words. */
const K = UI_KEYS.ui.period_picker;
/** The preset names, the date range picker's. */
const P = FORMS_KEYS.ui.date_range_picker;

/**
 * The shared PeriodPicker state.
 * @param props - the period, its default, the change handler, the presets and the day the presets count from
 * @param locale - the locale the comparison range is written in
 * @param numerals - the customer's digits for that range
 * @returns the period, its preset and mode, the choices and the changes
 */
export function usePeriodPickerState(
  {
    value,
    defaultValue,
    onChange,
    presets = PERIOD_PRESETS,
    today,
  }: Pick<PeriodPickerContractProps, "value" | "defaultValue" | "onChange" | "presets" | "today">,
  locale: string,
  numerals: NumberingSystem,
): {
  readonly period: PeriodValue;
  readonly preset: DateRangePreset | "custom";
  readonly mode: PeriodCompareMode | null;
  readonly versus: string | undefined;
  readonly presetItems: readonly { readonly id: string; readonly label: string }[];
  readonly modeItems: readonly { readonly id: PeriodCompareMode; readonly label: string }[];
  readonly choosePreset: (id: string | null | undefined) => void;
  readonly chooseRange: (range: DateRangeValue | null | undefined) => void;
  readonly setCompare: (isOn: boolean) => void;
  readonly chooseMode: (id: string | null | undefined) => void;
} {
  const t = useUiText();
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
  return {
    period,
    preset,
    mode,
    versus: period.compare
      ? t(K.versus, { range: withDigits(formatDateRange(period.compare.range, locale), numerals) })
      : undefined,
    presetItems: [
      ...presets.map((id) => ({ id, label: t(P[id]) })),
      { id: "custom", label: t(K.custom) },
    ],
    modeItems: PeriodCompareMode.map((id) => ({ id, label: t(K[id]) })),
    choosePreset: (id) => {
      if (!id) return;
      const picked = presets.find((item) => item === id);
      change(
        picked
          ? periodOf(picked, dateRangeOfPreset(picked, from), mode)
          : periodOf("custom", period.range, mode),
      );
    },
    chooseRange: (range) => {
      if (range) change(periodOf("custom", range, mode));
    },
    setCompare: (isOn) => change(periodOf(preset, period.range, isOn ? "previous" : null)),
    chooseMode: (id) => {
      const next = PeriodCompareMode.find((item) => item === id);
      if (next) change(periodOf(preset, period.range, next));
    },
  };
}
