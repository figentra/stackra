/**
 * Stackra file contract:
 * Purpose: the props DateField and DatePicker share: the field contract over a calendar day (`null` for an empty
 *          field), plus the surface, full width, the earliest and latest day, and the days to refuse. DatePicker adds
 *          its open state and the name of its calendar button; DateField adds nothing. Each runtime's props are this
 *          plus the props of its renderer, which pass through unchanged. FilterBar's date-range filter reuses the
 *          bounds by name.
 * Boundary: types only. The value is an `@internationalized/date` `CalendarDate`, a day with no time and no zone, which
 *           is what a due date or a birthday is and what React Aria takes unchanged (ADR 0318); native converts it to
 *           and from the platform's `Date` at local noon, so a day never shifts with the time zone. The type is imported
 *           as a type, so the contracts entry stays free of runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0318.
 */
import type { CalendarDate } from "@internationalized/date";

import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `DateField` and `DatePicker`. */
export interface DateValueContractProps extends FieldContractProps<CalendarDate | null> {
  /** The look of the field: `primary` on the page, `secondary` on a tinted surface. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width, false to size to the content. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** The earliest day the field accepts; an earlier one is invalid and the calendar refuses it. */
  readonly minValue?: CalendarDate | undefined;
  /** The latest day the field accepts; a later one is invalid and the calendar refuses it. */
  readonly maxValue?: CalendarDate | undefined;
  /** Whether a day is refused, for example a closed day; such a day shows as unavailable and is invalid when typed. */
  readonly isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
}
