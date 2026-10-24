/**
 * Stackra file contract:
 * Purpose: the web `Agenda` compound on HeroUI Pro's Agenda (a day, week and month calendar of events): the root and
 *          the twenty-three parts Header, Heading, Navigation, NavButton, TodayButton, ViewSelector, Body,
 *          WeekHeader, DayHeader, AllDaySection, AllDayLabel, AllDayEvent, TimeGrid, DayColumn, Event, EventTitle,
 *          EventTime, CurrentTimeIndicator, MonthGrid, MonthRow, MonthSpanningEvent, MonthCell and MonthEvent, with
 *          HeroUI Pro's own names; `useAgenda` supplies the state the root takes.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: the root takes the whole
 *          `useAgenda` result, `ViewSelector` already names its size `size`, and the root is a `div` with no role,
 *          where an `aria-label` would be refused by axe. The compound exposes the documented parts: HeroUI Pro's
 *          `Agenda.Root` is left out. Imports the `agenda` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  Agenda as HeroAgenda,
  type AgendaRootProps as HeroAgendaRootProps,
} from "@heroui-pro/react/agenda";

/** Props of the web Agenda: HeroUI Pro's own root props, which are the `useAgenda` result plus the children. */
export type AgendaProps = HeroAgendaRootProps;

/** The root: HeroUI Pro's, which lays out the views from the state `useAgenda` returns. */
function AgendaRoot(props: AgendaProps) {
  return <HeroAgenda.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface AgendaParts {
  /** The header row: heading, navigation and view selector. */
  readonly Header: typeof HeroAgenda.Header;
  /** The visible period as text, such as the month and year. */
  readonly Heading: typeof HeroAgenda.Heading;
  /** The group of previous, today and next buttons. */
  readonly Navigation: typeof HeroAgenda.Navigation;
  /** The previous or next period button, chosen by its `slot`. */
  readonly NavButton: typeof HeroAgenda.NavButton;
  /** The button that jumps to today. */
  readonly TodayButton: typeof HeroAgenda.TodayButton;
  /** The control that switches between day, week and month. */
  readonly ViewSelector: typeof HeroAgenda.ViewSelector;
  /** The scrolling body that holds the active view. */
  readonly Body: typeof HeroAgenda.Body;
  /** The row of day headers above a week or day view. */
  readonly WeekHeader: typeof HeroAgenda.WeekHeader;
  /** The header of one day. */
  readonly DayHeader: typeof HeroAgenda.DayHeader;
  /** The collapsible strip of all-day events. */
  readonly AllDaySection: typeof HeroAgenda.AllDaySection;
  /** The label of the all-day strip. */
  readonly AllDayLabel: typeof HeroAgenda.AllDayLabel;
  /** One all-day event in the strip. */
  readonly AllDayEvent: typeof HeroAgenda.AllDayEvent;
  /** The hour grid of a day or week view. */
  readonly TimeGrid: typeof HeroAgenda.TimeGrid;
  /** The column of one day inside the time grid. */
  readonly DayColumn: typeof HeroAgenda.DayColumn;
  /** One timed event, draggable and resizable. */
  readonly Event: typeof HeroAgenda.Event;
  /** The title inside an event. */
  readonly EventTitle: typeof HeroAgenda.EventTitle;
  /** The start and end time inside an event. */
  readonly EventTime: typeof HeroAgenda.EventTime;
  /** The line that marks the current time. */
  readonly CurrentTimeIndicator: typeof HeroAgenda.CurrentTimeIndicator;
  /** The grid of weeks in the month view. */
  readonly MonthGrid: typeof HeroAgenda.MonthGrid;
  /** One week row of the month view. */
  readonly MonthRow: typeof HeroAgenda.MonthRow;
  /** An event that spans several days in the month view. */
  readonly MonthSpanningEvent: typeof HeroAgenda.MonthSpanningEvent;
  /** One day cell of the month view. */
  readonly MonthCell: typeof HeroAgenda.MonthCell;
  /** One single-day event inside a month cell. */
  readonly MonthEvent: typeof HeroAgenda.MonthEvent;
}

/**
 * A calendar of events with day, week and month views. Call `useAgenda` for the state, spread it on the root, and
 * compose the parts inside: `Agenda.Header` and `Agenda.Body`.
 */
export const Agenda: typeof AgendaRoot & AgendaParts = Object.assign(AgendaRoot, {
  Header: HeroAgenda.Header,
  Heading: HeroAgenda.Heading,
  Navigation: HeroAgenda.Navigation,
  NavButton: HeroAgenda.NavButton,
  TodayButton: HeroAgenda.TodayButton,
  ViewSelector: HeroAgenda.ViewSelector,
  Body: HeroAgenda.Body,
  WeekHeader: HeroAgenda.WeekHeader,
  DayHeader: HeroAgenda.DayHeader,
  AllDaySection: HeroAgenda.AllDaySection,
  AllDayLabel: HeroAgenda.AllDayLabel,
  AllDayEvent: HeroAgenda.AllDayEvent,
  TimeGrid: HeroAgenda.TimeGrid,
  DayColumn: HeroAgenda.DayColumn,
  Event: HeroAgenda.Event,
  EventTitle: HeroAgenda.EventTitle,
  EventTime: HeroAgenda.EventTime,
  CurrentTimeIndicator: HeroAgenda.CurrentTimeIndicator,
  MonthGrid: HeroAgenda.MonthGrid,
  MonthRow: HeroAgenda.MonthRow,
  MonthSpanningEvent: HeroAgenda.MonthSpanningEvent,
  MonthCell: HeroAgenda.MonthCell,
  MonthEvent: HeroAgenda.MonthEvent,
});

export { useAgenda } from "@heroui-pro/react/agenda";
