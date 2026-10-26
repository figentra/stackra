/**
 * Stackra file contract:
 * Purpose: the native `Calendar` compound on HeroUI Native Pro's Calendar (a single-date calendar): the root maps
 *          `label` to `accessibilityLabel`; every other prop, `value`, `minValue`, `maxValue`, `locale` and
 *          `onChange` included, passes through with its `@internationalized/date` types.
 * Boundary: no behaviour or styling of its own. The compound exposes the eighteen parts of HeroUI Native Pro, its
 *          own components. HeroUI Native Pro's `useCalendar` hook stays in `heroui-native-pro/calendar`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-011.
 */
import { Calendar as HeroCalendar } from "heroui-native-pro/calendar";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CalendarProps } from "#native/calendar/calendar.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function CalendarRoot({ label, isDisabled, ...rest }: CalendarProps): ReactElement {
  return <HeroCalendar {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface CalendarParts {
  /** The toolbar row for the navigation buttons and the title. */
  readonly Header: typeof HeroCalendar.Header;
  /** The month and year text. */
  readonly Heading: typeof HeroCalendar.Heading;
  /** The previous or next month button, chosen by its `slot`. */
  readonly NavButton: typeof HeroCalendar.NavButton;
  /** The month grid container. */
  readonly Grid: typeof HeroCalendar.Grid;
  /** The weekday labels row; its child is a render function. */
  readonly GridHeader: typeof HeroCalendar.GridHeader;
  /** The day cells matrix; its child is a render function. */
  readonly GridBody: typeof HeroCalendar.GridBody;
  /** One weekday header cell. */
  readonly HeaderCell: typeof HeroCalendar.HeaderCell;
  /** The weekday text inside a header cell. */
  readonly HeaderCellLabel: typeof HeroCalendar.HeaderCellLabel;
  /** One selectable day cell. */
  readonly Cell: typeof HeroCalendar.Cell;
  /** The rounded body of a day cell, with the press scale. */
  readonly CellBody: typeof HeroCalendar.CellBody;
  /** The day number inside a cell. */
  readonly CellLabel: typeof HeroCalendar.CellLabel;
  /** The marker under a day, for example an event. */
  readonly CellIndicator: typeof HeroCalendar.CellIndicator;
  /** The pressable that opens the year picker in place of the heading. */
  readonly YearPickerTrigger: typeof HeroCalendar.YearPickerTrigger;
  /** The month and year text inside the year picker trigger. */
  readonly YearPickerTriggerHeading: typeof HeroCalendar.YearPickerTriggerHeading;
  /** The chevron that shows whether the year picker is open. */
  readonly YearPickerTriggerIndicator: typeof HeroCalendar.YearPickerTriggerIndicator;
  /** The overlay over the month grid that holds the years. */
  readonly YearPickerGrid: typeof HeroCalendar.YearPickerGrid;
  /** The scrollable list of years. */
  readonly YearPickerGridBody: typeof HeroCalendar.YearPickerGridBody;
  /** One pressable year. */
  readonly YearPickerCell: typeof HeroCalendar.YearPickerCell;
}

/**
 * A single-date calendar: `Calendar.Header` holds the heading and the navigation buttons, `Calendar.Grid` the weekday
 * and day cells, and the year picker parts replace the heading when a year picker is wanted. Name it for screen
 * readers with `label`.
 */
export const Calendar: typeof CalendarRoot & CalendarParts = Object.assign(CalendarRoot, {
  Header: HeroCalendar.Header,
  Heading: HeroCalendar.Heading,
  NavButton: HeroCalendar.NavButton,
  Grid: HeroCalendar.Grid,
  GridHeader: HeroCalendar.GridHeader,
  GridBody: HeroCalendar.GridBody,
  HeaderCell: HeroCalendar.HeaderCell,
  HeaderCellLabel: HeroCalendar.HeaderCellLabel,
  Cell: HeroCalendar.Cell,
  CellBody: HeroCalendar.CellBody,
  CellLabel: HeroCalendar.CellLabel,
  CellIndicator: HeroCalendar.CellIndicator,
  YearPickerTrigger: HeroCalendar.YearPickerTrigger,
  YearPickerTriggerHeading: HeroCalendar.YearPickerTriggerHeading,
  YearPickerTriggerIndicator: HeroCalendar.YearPickerTriggerIndicator,
  YearPickerGrid: HeroCalendar.YearPickerGrid,
  YearPickerGridBody: HeroCalendar.YearPickerGridBody,
  YearPickerCell: HeroCalendar.YearPickerCell,
});
