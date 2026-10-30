/**
 * Stackra file contract:
 * Purpose: `DateCalendar`, the month grid of the web DatePicker and DateTimePicker popovers and of the public inline
 *          Calendar: HeroUI's Calendar with a `div` header, mirrored month chevrons and narrow weekday names.
 * Boundary: internal; inside a picker the value comes from context, and the bounds are handed in because HeroUI's
 *           calendar would otherwise keep its own (1900-2099). The inline Calendar hands in its value too.
 * Runtime: browser
 * Governing contract: ADR 0318 (decision 7); wave 3a forms and pickers (owner approval 2026-10-28); ADR 0060; STA-1371.
 */
import { Calendar } from "@heroui/react";
import type { ComponentProps, ReactElement } from "react";

import { MONTH_BUTTON_CLASS } from "#react/date-picker/month-button-class.constant";
import { renderAsDiv } from "#react/date-picker/render-as-div.function";

/** The month grid of a date picker's popover, or of an inline calendar. */
export function DateCalendar(
  props: Omit<ComponentProps<typeof Calendar>, "children">,
): ReactElement {
  return (
    <Calendar {...props}>
      <Calendar.Header render={renderAsDiv}>
        <Calendar.Heading />
        <Calendar.NavButton slot="previous" className={MONTH_BUTTON_CLASS} />
        <Calendar.NavButton slot="next" className={MONTH_BUTTON_CLASS} />
      </Calendar.Header>
      {/* Narrow weekday names: HeroUI's short ones are whole words in Arabic and overflow its grid. */}
      <Calendar.Grid weekdayStyle="narrow">
        <Calendar.GridHeader>
          {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
        </Calendar.GridHeader>
        <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
      </Calendar.Grid>
    </Calendar>
  );
}
