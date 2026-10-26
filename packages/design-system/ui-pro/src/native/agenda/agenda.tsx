/**
 * Stackra file contract:
 * Purpose: the native `Agenda` compound on HeroUI Native Pro's Agenda (a day, week and month calendar of events on a
 *          split view): the root and the parts Background, Header, Calendar, CalendarHeader, CalendarGrid, Heading,
 *          TodayButton, NavButton, DragArea, DragHandle, Body, WeekHeader, AllDaySection, TimeGrid, DayColumns, Event,
 *          EventTitle, EventTime, CurrentTimeIndicator, MonthGrid and ViewSelector, with HeroUI Native Pro's own names;
 *          `useAgenda` supplies the state the root takes.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: the root takes the whole `useAgenda`
 *          result, and `ViewSelector` already names its size `size`. The compound exposes the parts of HeroUI Native
 *          Pro, its own components; the page template children of the root are HeroUI Native Pro's own, so none is
 *          wrapped. HeroUI Native Pro's `useAgendaContext`, `useAgendaEvent` and `useAgendaPage` hooks stay in
 *          `heroui-native-pro/agenda`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { Agenda as HeroAgenda } from "heroui-native-pro/agenda";
import type { ReactElement } from "react";
import type { AgendaProps } from "#native/agenda/agenda.props";

/** The root: HeroUI Native Pro's, which lays out the views on a split view from the `useAgenda` state. */
function AgendaRoot(props: AgendaProps): ReactElement {
  return <HeroAgenda {...props} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface AgendaParts {
  /** The theme-aware background layer behind the agenda. */
  readonly Background: typeof HeroAgenda.Background;
  /** The header row: heading, navigation and view selector. */
  readonly Header: typeof HeroAgenda.Header;
  /** The month calendar that sits above the day list. */
  readonly Calendar: typeof HeroAgenda.Calendar;
  /** The header row of the calendar. */
  readonly CalendarHeader: typeof HeroAgenda.CalendarHeader;
  /** The grid of days, drawn by a render function of each date. */
  readonly CalendarGrid: typeof HeroAgenda.CalendarGrid;
  /** The visible period as text, such as the month and year. */
  readonly Heading: typeof HeroAgenda.Heading;
  /** The button that jumps to today. */
  readonly TodayButton: typeof HeroAgenda.TodayButton;
  /** The previous or next period button, chosen by its `slot`. */
  readonly NavButton: typeof HeroAgenda.NavButton;
  /** The area that is dragged to resize the split view. */
  readonly DragArea: typeof HeroAgenda.DragArea;
  /** The handle shown on the drag area. */
  readonly DragHandle: typeof HeroAgenda.DragHandle;
  /** The scrolling body that holds the active view. */
  readonly Body: typeof HeroAgenda.Body;
  /** The row of day names above a week view. */
  readonly WeekHeader: typeof HeroAgenda.WeekHeader;
  /** The strip of all-day events. */
  readonly AllDaySection: typeof HeroAgenda.AllDaySection;
  /** The hour grid of a day or week view. */
  readonly TimeGrid: typeof HeroAgenda.TimeGrid;
  /** The columns of the visible days inside the time grid. */
  readonly DayColumns: typeof HeroAgenda.DayColumns;
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
  /** The segmented control that switches between day, week and month. */
  readonly ViewSelector: typeof HeroAgenda.ViewSelector;
}

/**
 * A calendar of events with day, week and month views. Call `useAgenda` for the state, spread it on the root, and
 * compose the parts inside: `Agenda.Header`, `Agenda.Body` and the rest.
 */
export const Agenda: typeof AgendaRoot & AgendaParts = Object.assign(AgendaRoot, {
  Background: HeroAgenda.Background,
  Header: HeroAgenda.Header,
  Calendar: HeroAgenda.Calendar,
  CalendarHeader: HeroAgenda.CalendarHeader,
  CalendarGrid: HeroAgenda.CalendarGrid,
  Heading: HeroAgenda.Heading,
  TodayButton: HeroAgenda.TodayButton,
  NavButton: HeroAgenda.NavButton,
  DragArea: HeroAgenda.DragArea,
  DragHandle: HeroAgenda.DragHandle,
  Body: HeroAgenda.Body,
  WeekHeader: HeroAgenda.WeekHeader,
  AllDaySection: HeroAgenda.AllDaySection,
  TimeGrid: HeroAgenda.TimeGrid,
  DayColumns: HeroAgenda.DayColumns,
  Event: HeroAgenda.Event,
  EventTitle: HeroAgenda.EventTitle,
  EventTime: HeroAgenda.EventTime,
  CurrentTimeIndicator: HeroAgenda.CurrentTimeIndicator,
  MonthGrid: HeroAgenda.MonthGrid,
  ViewSelector: HeroAgenda.ViewSelector,
});

export { useAgenda } from "heroui-native-pro/agenda";
