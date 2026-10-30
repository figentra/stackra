/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DatePicker` takes: the day props it shares with `DateField`, the open state of its
 *          calendar, and the spoken name of the button that opens it. Each runtime's `DatePickerProps` is this plus the
 *          props of its renderer's date picker, which pass through unchanged.
 * Boundary: types only. The calendar is the picker's overlay, so its open state is the overlay vocabulary of wave 4
 *           (ADR 0312): an app opens it with `isOpen` exactly as it opens a Popover.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0312 (open state); ADR 0318.
 */
import type { CalendarDate } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { DatePreset } from "#contracts/enums/date-preset.enum";
import type { DateValueContractProps } from "#contracts/types/date-value-contract-props.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `DatePicker`. */
export interface DatePickerContractProps extends DateValueContractProps, OpenStateContractProps {
  /** The spoken name of the button that opens the calendar, for example "Choose the due date". Defaults to the `ui` catalogue's phrase in the active locale. */
  readonly calendarButtonLabel?: string | undefined;
  /** The calendar the day is shown in: `islamic-umalqura` for the Hijri calendar a Saudi market pack sets. Defaults to
   *  `gregory`. The value stays a Gregorian `CalendarDate` either way. */
  readonly calendar?: CalendarSystem | undefined;
  /** One-day shortcuts beside the calendar (Today, Yesterday, Tomorrow, …); left out, none. Pass `DatePreset` for all. */
  readonly presets?: readonly DatePreset[] | undefined;
  /** The day the presets count from; defaults to today. */
  readonly today?: CalendarDate | undefined;
}
