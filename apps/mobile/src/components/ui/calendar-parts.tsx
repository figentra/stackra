/**
 * Stackra file contract:
 * Purpose: the parts of a month calendar (header with the heading or year picker and the month buttons, weekday row,
 *          day cells with optional event dots, year list) as one fragment, so the Calendar and DatePicker review
 *          pages draw the same calendar and a change to it is made once.
 * Boundary: one presentational component; it must sit inside a `Calendar` or a `DatePicker.Calendar`, which own
 *          the value, the range and the locale.
 * Runtime: react-native
 * Governing contract: ADR 0304 (decision 6); STA-403 FR-011.
 */
import { Calendar } from "@stackra/ui-pro/native";

/** Props of {@link CalendarParts}. */
export interface CalendarPartsProps {
  /** Days of the month that get a dot under the number, for example days with an event. */
  eventDays?: readonly number[];
  /** True to replace the heading with the year picker trigger and add the year list. */
  hasYearPicker?: boolean;
}

/** The month calendar's parts: header, weekday labels, day cells with event dots and, optionally, the year picker. */
export function CalendarParts({ eventDays = [], hasYearPicker = false }: CalendarPartsProps) {
  return (
    <>
      <Calendar.Header>
        {hasYearPicker ? (
          <Calendar.YearPickerTrigger>
            <Calendar.YearPickerTriggerHeading />
            <Calendar.YearPickerTriggerIndicator />
          </Calendar.YearPickerTrigger>
        ) : (
          <Calendar.Heading />
        )}
        <Calendar.NavButton slot="previous" />
        <Calendar.NavButton slot="next" />
      </Calendar.Header>
      <Calendar.Grid>
        <Calendar.GridHeader>{(day) => <Calendar.HeaderCell day={day} />}</Calendar.GridHeader>
        <Calendar.GridBody>
          {(date) => (
            <Calendar.Cell date={date}>
              {(renderProps) => (
                <Calendar.CellBody cellRenderProps={renderProps}>
                  <Calendar.CellLabel cellRenderProps={renderProps}>
                    {renderProps.formattedDate}
                  </Calendar.CellLabel>
                  {eventDays.includes(date.day) ? (
                    <Calendar.CellIndicator cellRenderProps={renderProps} />
                  ) : null}
                </Calendar.CellBody>
              )}
            </Calendar.Cell>
          )}
        </Calendar.GridBody>
      </Calendar.Grid>
      {hasYearPicker ? (
        <Calendar.YearPickerGrid>
          <Calendar.YearPickerGridBody>
            {({ year, isSelected }) => (
              <Calendar.YearPickerCell year={year} isSelected={isSelected} />
            )}
          </Calendar.YearPickerGridBody>
        </Calendar.YearPickerGrid>
      ) : null}
    </>
  );
}
