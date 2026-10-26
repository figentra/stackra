/**
 * Stackra file contract:
 * Purpose: the native `RangeCalendar` compound on HeroUI Native Pro's RangeCalendar (a calendar that selects a range of dates): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `minValue`, `maxValue`, `locale` and `onChange`, with their `@internationalized/date` types, included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the eighteen parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { RangeCalendar as HeroRangeCalendar } from "heroui-native-pro/range-calendar";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RangeCalendarProps } from "#native/range-calendar/range-calendar.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function RangeCalendarRoot({ label, isDisabled, ...rest }: RangeCalendarProps): ReactElement {
  return (
    <HeroRangeCalendar {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface RangeCalendarParts {
  /** The toolbar row for the navigation buttons and the title. */
  readonly Header: typeof HeroRangeCalendar.Header;
  /** The month and year text. */
  readonly Heading: typeof HeroRangeCalendar.Heading;
  /** The previous or next month button, chosen by its `slot`. */
  readonly NavButton: typeof HeroRangeCalendar.NavButton;
  /** The month grid container. */
  readonly Grid: typeof HeroRangeCalendar.Grid;
  /** The weekday labels row; its child is a render function. */
  readonly GridHeader: typeof HeroRangeCalendar.GridHeader;
  /** The day cells matrix; its child is a render function. */
  readonly GridBody: typeof HeroRangeCalendar.GridBody;
  /** One weekday header cell. */
  readonly HeaderCell: typeof HeroRangeCalendar.HeaderCell;
  /** The weekday text inside a header cell. */
  readonly HeaderCellLabel: typeof HeroRangeCalendar.HeaderCellLabel;
  /** One selectable day cell. */
  readonly Cell: typeof HeroRangeCalendar.Cell;
  /** The rounded body of a day cell, with the press scale. */
  readonly CellBody: typeof HeroRangeCalendar.CellBody;
  /** The day number inside a cell. */
  readonly CellLabel: typeof HeroRangeCalendar.CellLabel;
  /** The marker under a day, for example an event. */
  readonly CellIndicator: typeof HeroRangeCalendar.CellIndicator;
  /** The pressable that opens the year picker in place of the heading. */
  readonly YearPickerTrigger: typeof HeroRangeCalendar.YearPickerTrigger;
  /** The month and year text inside the year picker trigger. */
  readonly YearPickerTriggerHeading: typeof HeroRangeCalendar.YearPickerTriggerHeading;
  /** The chevron that shows whether the year picker is open. */
  readonly YearPickerTriggerIndicator: typeof HeroRangeCalendar.YearPickerTriggerIndicator;
  /** The overlay over the month grid that holds the years. */
  readonly YearPickerGrid: typeof HeroRangeCalendar.YearPickerGrid;
  /** The scrollable list of years. */
  readonly YearPickerGridBody: typeof HeroRangeCalendar.YearPickerGridBody;
  /** One pressable year. */
  readonly YearPickerCell: typeof HeroRangeCalendar.YearPickerCell;
}

/**
 * A range calendar: `RangeCalendar.Header` holds the heading and the navigation buttons, `RangeCalendar.Grid` the weekday and day cells, and the year picker parts replace the heading when a year picker is wanted. Name it for screen readers with `label`.
 */
export const RangeCalendar: typeof RangeCalendarRoot & RangeCalendarParts = Object.assign(
  RangeCalendarRoot,
  {
    Header: HeroRangeCalendar.Header,
    Heading: HeroRangeCalendar.Heading,
    NavButton: HeroRangeCalendar.NavButton,
    Grid: HeroRangeCalendar.Grid,
    GridHeader: HeroRangeCalendar.GridHeader,
    GridBody: HeroRangeCalendar.GridBody,
    HeaderCell: HeroRangeCalendar.HeaderCell,
    HeaderCellLabel: HeroRangeCalendar.HeaderCellLabel,
    Cell: HeroRangeCalendar.Cell,
    CellBody: HeroRangeCalendar.CellBody,
    CellLabel: HeroRangeCalendar.CellLabel,
    CellIndicator: HeroRangeCalendar.CellIndicator,
    YearPickerTrigger: HeroRangeCalendar.YearPickerTrigger,
    YearPickerTriggerHeading: HeroRangeCalendar.YearPickerTriggerHeading,
    YearPickerTriggerIndicator: HeroRangeCalendar.YearPickerTriggerIndicator,
    YearPickerGrid: HeroRangeCalendar.YearPickerGrid,
    YearPickerGridBody: HeroRangeCalendar.YearPickerGridBody,
    YearPickerCell: HeroRangeCalendar.YearPickerCell,
  },
);
