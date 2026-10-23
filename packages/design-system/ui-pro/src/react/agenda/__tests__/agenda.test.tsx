/**
 * Stackra file contract:
 * Purpose: proves the web Agenda takes the `useAgenda` state on its root, draws the heading and a timed event, passes
 *          unknown props through, and carries HeroUI Pro's own parts and `useAgenda` hook.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `ResizeObserver` is stubbed and scrolling is not exercised
 *          because jsdom has no layout engine, so drag, resize and the current-time line are not checked.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { Agenda as HeroAgenda, useAgenda as heroUseAgenda } from "@heroui-pro/react/agenda";
import { CalendarDate, CalendarDateTime } from "@internationalized/date";
import { render, screen } from "@testing-library/react";

import { Agenda, useAgenda } from "#react/agenda/agenda";

const EVENTS = [
  {
    id: "standup",
    title: "Standup",
    start: new CalendarDateTime(2026, 10, 23, 9),
    end: new CalendarDateTime(2026, 10, 23, 10),
  },
];

/** A day view on a fixed date, composed from the wrapper's own parts. */
function Example() {
  const agenda = useAgenda({
    events: EVENTS,
    defaultView: "day",
    defaultDate: new CalendarDate(2026, 10, 23),
    startHour: 8,
    endHour: 12,
  });
  return (
    <Agenda {...agenda} data-testid="agenda" className="extra">
      <Agenda.Header>
        <Agenda.Heading data-testid="heading" />
      </Agenda.Header>
      <Agenda.Body>
        <Agenda.TimeGrid>
          <Agenda.DayColumn date={agenda.visibleDays[0] as CalendarDate}>
            {agenda.getEventsForDay(agenda.visibleDays[0] as CalendarDate).map((event) => (
              <Agenda.Event key={event.id} event={event}>
                <Agenda.EventTitle>{event.title}</Agenda.EventTitle>
              </Agenda.Event>
            ))}
          </Agenda.DayColumn>
        </Agenda.TimeGrid>
      </Agenda.Body>
    </Agenda>
  );
}

describe("Agenda (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("draws the heading and the event from the useAgenda state, and passes unknown props through", () => {
    render(<Example />);
    expect(screen.getByTestId("agenda").classList.contains("extra")).toBe(true);
    expect(screen.getByTestId("heading").textContent).toContain("2026");
    expect(screen.getByText("Standup")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts and hook", () => {
    for (const part of [
      "Header",
      "Heading",
      "Navigation",
      "NavButton",
      "TodayButton",
      "ViewSelector",
      "Body",
      "WeekHeader",
      "DayHeader",
      "AllDaySection",
      "AllDayLabel",
      "AllDayEvent",
      "TimeGrid",
      "DayColumn",
      "Event",
      "EventTitle",
      "EventTime",
      "CurrentTimeIndicator",
      "MonthGrid",
      "MonthRow",
      "MonthSpanningEvent",
      "MonthCell",
      "MonthEvent",
    ] as const) {
      expect(Agenda[part]).toBe(HeroAgenda[part]);
    }
    expect(useAgenda).toBe(heroUseAgenda);
  });
});
