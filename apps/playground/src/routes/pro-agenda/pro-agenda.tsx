/**
 * Stackra file contract:
 * Purpose: the page of the Agenda route: `@stackra/ui-pro`'s Agenda as a week calendar with a day, week and month view
 *          selector, previous, today and next buttons, an all-day row and a time grid, where a drag across the grid
 *          creates an event that can then be moved, resized or deleted, and a count of the events made.
 * Boundary: presentation and local state only. The calendar starts empty, because building an event needs
 *          `@internationalized/date`, which the playground does not depend on; the events the page holds are the ones
 *          the calendar hands to `onEventCreate`. Creating, moving and resizing are pointer gestures.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProAgendaRoute } from "#src/routes/pro-agenda/pro-agenda.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-agenda.*` keys.
const STRINGS = {
  documentTitle: `${ProAgendaRoute.title} · Stackra Playground`,
  intro:
    "A calendar with day, week and month views. Switch the view or move through time with the buttons; in the day and week views, drag across the time grid to create an event, then drag it to move it or its edge to resize it.",
  calendar: "Calendar",
  newEvent: "New event",
  count: (count: number) => (count === 1 ? "1 event created" : `${count} events created`),
} as const;

/** The Agenda page. */
export function ProAgenda() {
  const [events, setEvents] = useState<UiPro.AgendaProps["events"]>([]);

  const agenda = UiPro.useAgenda({
    defaultView: "week",
    events,
    onEventCreate: ({ start, end }) =>
      setEvents((current) => [
        ...current,
        { id: `event-${current.length + 1}`, title: STRINGS.newEvent, start, end },
      ]),
    onEventDelete: (id) => setEvents((current) => current.filter((event) => event.id !== id)),
    onEventMove: (id, start, end) =>
      setEvents((current) =>
        current.map((event) => (event.id === id ? { ...event, start, end } : event)),
      ),
    onEventResize: (id, start, end) =>
      setEvents((current) =>
        current.map((event) => (event.id === id ? { ...event, start, end } : event)),
      ),
  });

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProAgendaRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="calendar-heading" className="grid gap-3">
        <h2 id="calendar-heading" className="type-h2">
          {STRINGS.calendar}
        </h2>
        <div className="h-[36rem] w-full">
          <UiPro.Agenda {...agenda}>
            <UiPro.Agenda.Header>
              <UiPro.Agenda.Heading />
              <UiPro.Agenda.ViewSelector />
              <UiPro.Agenda.Navigation>
                <UiPro.Agenda.NavButton slot="previous" />
                <UiPro.Agenda.TodayButton />
                <UiPro.Agenda.NavButton slot="next" />
              </UiPro.Agenda.Navigation>
            </UiPro.Agenda.Header>
            <UiPro.Agenda.Body>
              {agenda.view === "month" ? (
                <UiPro.Agenda.MonthGrid>
                  {agenda.visibleWeeks.map((week) => {
                    const layout = agenda.getMonthRowLayout(week);
                    return (
                      <UiPro.Agenda.MonthRow
                        key={week[0]?.toString()}
                        spanningRowCount={layout.rowCount}
                      >
                        {layout.items.map((item) => (
                          <UiPro.Agenda.MonthSpanningEvent
                            key={item.event.id}
                            colSpan={item.colSpan}
                            colStart={item.colStart}
                            event={item.event}
                            row={item.row}
                          />
                        ))}
                        {week.map((day, column) => (
                          <UiPro.Agenda.MonthCell
                            key={day.toString()}
                            date={day}
                            maxEvents={2}
                            spanningRowCount={layout.rowCountPerCol[column] ?? 0}
                          >
                            {agenda.getPerCellEvents(day, week).map((event) => (
                              <UiPro.Agenda.MonthEvent key={event.id} event={event} />
                            ))}
                          </UiPro.Agenda.MonthCell>
                        ))}
                      </UiPro.Agenda.MonthRow>
                    );
                  })}
                </UiPro.Agenda.MonthGrid>
              ) : (
                <>
                  <UiPro.Agenda.WeekHeader />
                  <UiPro.Agenda.AllDaySection>
                    {agenda.allDayLayout.map((item) => (
                      <UiPro.Agenda.AllDayEvent
                        key={item.event.id}
                        colSpan={item.colSpan}
                        colStart={item.colStart}
                        event={item.event}
                        row={item.row}
                      />
                    ))}
                  </UiPro.Agenda.AllDaySection>
                  <UiPro.Agenda.TimeGrid>
                    <UiPro.Agenda.CurrentTimeIndicator />
                    {agenda.visibleDays.map((day) => (
                      <UiPro.Agenda.DayColumn key={day.toString()} date={day}>
                        {agenda.getEventsForDay(day).map((event) => (
                          <UiPro.Agenda.Event key={event.id} event={event} />
                        ))}
                      </UiPro.Agenda.DayColumn>
                    ))}
                  </UiPro.Agenda.TimeGrid>
                </>
              )}
            </UiPro.Agenda.Body>
          </UiPro.Agenda>
        </div>
        <p role="status">
          <bdi>{STRINGS.count(events.length)}</bdi>
        </p>
      </section>
    </article>
  );
}
