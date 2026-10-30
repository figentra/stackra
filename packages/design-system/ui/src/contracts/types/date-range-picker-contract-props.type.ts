/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DateRangePicker` takes: a labelled field over a range of days, with a
 *          RangeCalendar and a list of preset ranges ("Last 7 days") in its overlay.
 * Boundary: types only; the presets are worked out from today by `dateRangeOfPreset`.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import type { CalendarDate } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `DateRangePicker`. */
export interface DateRangePickerContractProps
  extends FieldContractProps<DateRangeValue | null>, OpenStateContractProps {
  /** The look of the field. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** The presets offered, in order; an empty list hides them. Defaults to every preset. */
  readonly presets?: readonly DateRangePreset[] | undefined;
  /** The earliest day that can be picked. */
  readonly minValue?: CalendarDate | undefined;
  /** The latest day that can be picked. */
  readonly maxValue?: CalendarDate | undefined;
  /** The calendar the days are shown in; defaults to `gregory`. The value stays Gregorian. */
  readonly calendar?: CalendarSystem | undefined;
  /** The spoken name of the button that opens the calendar; defaults to the `ui` catalogue's phrase. */
  readonly calendarButtonLabel?: string | undefined;
}
