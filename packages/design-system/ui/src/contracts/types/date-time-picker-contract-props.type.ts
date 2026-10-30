/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DateTimePicker` takes: a day and a time of day in one field.
 * Boundary: types only. The value is a `CalendarDateTime` (no zone): the app adds the zone it means.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import type { CalendarDateTime } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `DateTimePicker`. */
export interface DateTimePickerContractProps
  extends FieldContractProps<CalendarDateTime | null>, OpenStateContractProps {
  /** The look of the field. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** The earliest moment accepted. */
  readonly minValue?: CalendarDateTime | undefined;
  /** The latest moment accepted. */
  readonly maxValue?: CalendarDateTime | undefined;
  /** 12 or 24 hours; defaults to the locale's. */
  readonly hourCycle?: HourCycle | undefined;
  /** The calendar the day is shown in; defaults to `gregory`. The value stays Gregorian. */
  readonly calendar?: CalendarSystem | undefined;
  /** The spoken name of the button that opens the calendar; defaults to the `ui` catalogue's phrase. */
  readonly calendarButtonLabel?: string | undefined;
}
