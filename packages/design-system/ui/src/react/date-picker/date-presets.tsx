/**
 * Stackra file contract:
 * Purpose: `DatePresets`, the one-day shortcuts inside the web DatePicker's popover: a named group of buttons that set
 *          the picker's day through React Aria's picker state and close the popover; the chosen day's button is
 *          pressed.
 * Boundary: internal; rendered inside `DatePicker.Popover`, where `DatePickerStateContext` is provided. The words are
 *           the `ui` catalogue's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import { use, type ReactElement } from "react";
import { DatePickerStateContext } from "react-aria-components";

import type { DatePreset } from "#contracts/enums/date-preset.enum";
import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { dateOfPreset } from "#core/functions/date-of-preset.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The presets' keys. */
const K = DISPLAY_KEYS.ui.date_presets;

/** One-day shortcuts. */
export function DatePresets({
  presets,
  today,
}: {
  readonly presets: readonly DatePreset[];
  readonly today: CalendarDate;
}): ReactElement {
  const t = useUiText();
  const state = use(DatePickerStateContext);
  const chosen = state?.value?.toString();
  return (
    <div
      role="group"
      aria-label={t(K.label)}
      className="flex flex-wrap gap-1 sm:flex-col sm:border-e sm:border-separator sm:pe-3"
    >
      {presets.map((preset) => {
        const day = dateOfPreset(preset, today);
        const isChosen = chosen === day.toString();
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={isChosen}
            onClick={() => {
              state?.setValue(day);
              state?.close();
            }}
            className={
              cn(
                "min-h-8 rounded-[var(--radius-control)] px-3 text-start text-sm outline-none hover:bg-default focus-visible:outline-2 focus-visible:outline-focus",
                isChosen && "bg-accent-soft text-accent-soft-foreground",
              ) ?? ""
            }
          >
            {t(K[preset])}
          </button>
        );
      })}
    </div>
  );
}
