/**
 * Stackra file contract:
 * Purpose: the parts of a range calendar (header with the heading or year picker and the month buttons, weekday row,
 *          day cells, year list) as one fragment, so the RangeCalendar and DateRangePicker review pages draw the same
 *          calendar and a change to it is made once.
 * Boundary: one presentational component; it must sit inside a `RangeCalendar` or a `DateRangePicker.Calendar`, which
 *          own the range, the limits and the locale.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { RangeCalendar } from "@stackra-pro/ui/native";

/** Props of {@link RangeCalendarParts}. */
export interface RangeCalendarPartsProps {
  /** True to replace the heading with the year picker trigger and add the year list. */
  hasYearPicker?: boolean;
}

/** The range calendar's parts: header, weekday labels, day cells and, optionally, the year picker. */
export function RangeCalendarParts({ hasYearPicker = false }: RangeCalendarPartsProps) {
  return (
    <>
      <RangeCalendar.Header>
        {hasYearPicker ? (
          <RangeCalendar.YearPickerTrigger>
            <RangeCalendar.YearPickerTriggerHeading />
            <RangeCalendar.YearPickerTriggerIndicator />
          </RangeCalendar.YearPickerTrigger>
        ) : (
          <RangeCalendar.Heading />
        )}
        <RangeCalendar.NavButton slot="previous" />
        <RangeCalendar.NavButton slot="next" />
      </RangeCalendar.Header>
      <RangeCalendar.Grid>
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell day={day} />}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>
          {(date) => <RangeCalendar.Cell date={date} />}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
      {hasYearPicker ? (
        <RangeCalendar.YearPickerGrid>
          <RangeCalendar.YearPickerGridBody>
            {({ year, isSelected }) => (
              <RangeCalendar.YearPickerCell year={year} isSelected={isSelected} />
            )}
          </RangeCalendar.YearPickerGridBody>
        </RangeCalendar.YearPickerGrid>
      ) : null}
    </>
  );
}
