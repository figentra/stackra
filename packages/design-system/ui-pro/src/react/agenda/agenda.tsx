/**
 * Stackra file contract:
 * Purpose: the web `Agenda` compound on HeroUI Pro's Agenda (a day, week and month calendar of events): the root and
 *          the twenty-three parts Header, Heading, Navigation, NavButton, TodayButton, ViewSelector, Body,
 *          WeekHeader, DayHeader, AllDaySection, AllDayLabel, AllDayEvent, TimeGrid, DayColumn, Event, EventTitle,
 *          EventTime, CurrentTimeIndicator, MonthGrid, MonthRow, MonthSpanningEvent, MonthCell and MonthEvent, with
 *          HeroUI Pro's own names; `useAgenda` supplies the state the root takes.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: the root takes the whole
 *          `useAgenda` result, `ViewSelector` already names its size `size`, and the root is a `div` with no role,
 *          where an `aria-label` would be refused by axe. `Heading` is the one part of its own: it takes a `level`
 *          (`h2` by default), where HeroUI Pro's is always an `h1`. The compound exposes the documented parts:
 *          HeroUI Pro's `Agenda.Root` is left out. Imports the `agenda` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  agendaVariants,
  Agenda as HeroAgenda,
  type AgendaRootProps as HeroAgendaRootProps,
} from "@heroui-pro/react/agenda";
import type { HeadingLevel } from "@stackra/ui/contracts";
import { createContext, useContext, type ComponentPropsWithoutRef } from "react";

/** Props of the web Agenda: HeroUI Pro's own root props, which are the `useAgenda` result plus the children. */
export type AgendaProps = HeroAgendaRootProps;

/** Props of `Agenda.Heading`: a heading's own props, plus the level the page outline gives it. */
export interface AgendaHeadingProps extends ComponentPropsWithoutRef<"h2"> {
  /** The heading level, `h2` unless told otherwise. */
  readonly level?: HeadingLevel | undefined;
}

/** The visible period (`useAgenda`'s `heading`), which the root shares with `Agenda.Heading`. */
const AgendaHeadingContext = createContext("");

/** The root: HeroUI Pro's, which lays out the views from the state `useAgenda` returns. */
function AgendaRoot(props: AgendaProps) {
  return (
    <AgendaHeadingContext value={props.heading}>
      <HeroAgenda.Root {...props} />
    </AgendaHeadingContext>
  );
}

/**
 * The visible period as a heading at `level`. HeroUI Pro's own part is always an `h1`, which gives a page a second
 * top-level heading, so this draws the same text and class at the level the caller's outline needs.
 */
function AgendaHeading({ level = 2, className, children, ...props }: AgendaHeadingProps) {
  const heading = useContext(AgendaHeadingContext);
  const Tag = `h${level}` as const;
  return (
    <Tag className={agendaVariants().heading({ className })} data-slot="agenda-heading" {...props}>
      {children ?? heading}
    </Tag>
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface AgendaParts {
  /** The header row: heading, navigation and view selector. */
  readonly Header: typeof HeroAgenda.Header;
  /** The visible period as text, such as the month and year, as a heading at its `level`. */
  readonly Heading: typeof AgendaHeading;
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
  Heading: AgendaHeading,
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
