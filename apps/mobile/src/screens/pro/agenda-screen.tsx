/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Agenda` (@stackra/ui-pro): a month calendar over a day, week
 *          and month body with timed, all-day, read-only and unconfirmed events that can be dragged and resized, with
 *          the view switched from a button row and the visible period read back, in the locale the display switcher
 *          chose.
 * Boundary: presentation and local demo state only; the agenda is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import {
  getLocalTimeZone,
  Time,
  toCalendarDateTime,
  today,
  type CalendarDate,
  type CalendarDateTime,
} from "@internationalized/date";
import { useDesignSystem } from "@stackra/ui/native";
import { Agenda, useAgenda } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { ChoiceGroup } from "#src/components/ui/choice-group";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  views: {
    title: "Day, week and month",
    description:
      "Drag an event to move it, drag its edge to resize it, and pull the handle to collapse the calendar. The read-only event stays put.",
    group: "View",
    day: "Day",
    week: "Week",
    month: "Month",
    visible: "Showing:",
  },
  events: {
    standup: "Daily standup",
    interview: "Candidate interview",
    review: "Design review (read-only)",
    offsite: "Team offsite",
    lunch: "Lunch with the supplier (unconfirmed)",
  },
} as const;

type AgendaOptions = NonNullable<Parameters<typeof useAgenda>[0]>;
type AgendaEvent = AgendaOptions["events"][number];
type AgendaView = NonNullable<AgendaOptions["view"]>;

const VIEW_CHOICES = [
  { value: "day", label: STRINGS.views.day },
  { value: "week", label: STRINGS.views.week },
  { value: "month", label: STRINGS.views.month },
] as const satisfies readonly { value: AgendaView; label: string }[];

/** A date-time on the given day at the given hour and minute. */
function at(day: CalendarDate, hour: number, minute = 0): CalendarDateTime {
  return toCalendarDateTime(day, new Time(hour, minute));
}

/** The demo events, all relative to today so the page always shows something. */
function buildEvents(): AgendaEvent[] {
  const base = today(getLocalTimeZone());
  return [
    {
      id: "standup",
      title: STRINGS.events.standup,
      start: at(base, 10, 30),
      end: at(base, 11, 30),
    },
    { id: "interview", title: STRINGS.events.interview, start: at(base, 10), end: at(base, 12) },
    {
      id: "review",
      title: STRINGS.events.review,
      start: at(base, 8),
      end: at(base, 9),
      isReadOnly: true,
    },
    {
      id: "offsite",
      title: STRINGS.events.offsite,
      start: at(base, 0),
      end: at(base.add({ days: 2 }), 0),
      isAllDay: true,
    },
    {
      id: "lunch",
      title: STRINGS.events.lunch,
      start: at(base.add({ days: 1 }), 13),
      end: at(base.add({ days: 1 }), 14),
      status: "unconfirmed",
    },
  ];
}

/** The Agenda page: the view switcher and one agenda in a bounded box, in a scrollable screen. */
export function AgendaScreen() {
  const { locale } = useDesignSystem();
  const [events, setEvents] = useState<AgendaEvent[]>(buildEvents);
  const [view, setView] = useState<AgendaView>("week");

  const applyChange = useCallback((id: string, start: CalendarDateTime, end: CalendarDateTime) => {
    setEvents((previous) =>
      previous.map((event) => (event.id === id ? { ...event, start, end } : event)),
    );
  }, []);

  const agenda = useAgenda({
    events,
    view,
    onViewChange: setView,
    locale,
    onEventMove: applyChange,
    onEventResize: applyChange,
  });

  return (
    <Screen>
      <Section title={STRINGS.views.title} description={STRINGS.views.description}>
        <ChoiceGroup
          label={STRINGS.views.group}
          choices={VIEW_CHOICES}
          value={view}
          onChange={setView}
        />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.views.visible} ${agenda.heading}`}
        </Typography.Paragraph>
        <View className="h-150">
          <Agenda {...agenda} />
        </View>
      </Section>
    </Screen>
  );
}
