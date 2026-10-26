/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ResourceScheduler` (@stackra-pro/ui): a salon morning, three
 *          chairs on a 15-minute step, with a colour booking whose processing gap holds a second booking; a drag or a
 *          screen-reader action is accepted and the last change is read out.
 * Boundary: presentation and local demo state only; the hours, the step and the chairs are the demo's data, which a
 *           product reads from settings and the market pack.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decisions 3 and 6); WCAG 2.2 SC 2.5.7; STA-803.
 */
import type { SchedulerEvent } from "@stackra-pro/ui/contracts";
import { ResourceScheduler } from "@stackra-pro/ui/native";
import { Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  title: "Day view",
  description:
    "Drag a booking to move it, drag its bottom edge to resize it, or use the screen-reader actions.",
  label: "Salon bookings, Monday",
  hint: "Swipe up or down to move by 15 minutes; the actions menu also moves it to another chair and resizes it.",
  moved: (title: string) => `Moved ${title}`,
} as const;

const DAY = "2026-11-02";

const RESOURCES = [
  { id: "amal", label: "Amal", labelText: "Amal" },
  { id: "nour", label: "Nour", labelText: "Nour" },
  { id: "lina", label: "Lina", labelText: "Lina" },
] as const;

const BOOKINGS: readonly SchedulerEvent[] = [
  {
    id: "colour",
    title: "Colour, Sara",
    day: DAY,
    resource: "amal",
    start: 600,
    end: 720,
    segments: [
      { offset: 0, duration: 30, kind: "busy" },
      { offset: 30, duration: 60, kind: "processing" },
      { offset: 90, duration: 30, kind: "busy" },
    ],
  },
  { id: "trim", title: "Trim, Huda", day: DAY, resource: "amal", start: 645, end: 675 },
  { id: "blow", title: "Blow-dry, Mona", day: DAY, resource: "nour", start: 570, end: 615 },
];

/** A minute from midnight as `HH:MM`, on a 24-hour clock. */
const formatMinute = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/** The ResourceScheduler page. */
export function ResourceSchedulerScreen() {
  const [events, setEvents] = useState<readonly SchedulerEvent[]>(BOOKINGS);
  const [last, setLast] = useState("");
  return (
    <Screen>
      <Section title={STRINGS.title} description={STRINGS.description}>
        <ResourceScheduler
          label={STRINGS.label}
          view="day"
          days={[DAY]}
          resources={RESOURCES}
          startMinute={540}
          endMinute={780}
          slotMinutes={15}
          events={events}
          onEventChange={(changed) => {
            setEvents((all) => all.map((event) => (event.id === changed.id ? changed : event)));
            setLast(STRINGS.moved(changed.title));
          }}
          formatMinute={formatMinute}
          formatDay={() => "Mon 2 Nov"}
          keyboardHint={STRINGS.hint}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {last}
        </Text>
      </Section>
    </Screen>
  );
}
