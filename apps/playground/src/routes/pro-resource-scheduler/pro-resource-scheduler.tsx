/**
 * Stackra file contract:
 * Purpose: the page of the Resource scheduler route: `@stackra-pro/ui`'s ResourceScheduler as a salon day, three
 *          chairs from 09:00 to 18:00 on a 15-minute step, with a colour booking whose processing gap holds a second
 *          booking; a move or resize is accepted on the page and the last change is announced.
 * Boundary: presentation only; the bookings are local state. The hours, the step and the resources are data a product
 *           reads from settings and the market pack; here they are the demo's.
 * Runtime: browser
 * Governing contract: ADR 0310 (decisions 3 and 12); WCAG 2.2 SC 2.1.1 and 2.5.7; STA-803.
 */
import type { SchedulerEvent } from "@stackra-pro/ui/contracts";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProResourceSchedulerRoute } from "#src/routes/pro-resource-scheduler/pro-resource-scheduler.route";

// shortcut: English strings in one place until the playground reads `playground::*` keys (STA-788).
const STRINGS = {
  documentTitle: `${ProResourceSchedulerRoute.title} · Stackra Playground`,
  intro:
    "Bookings in one column per chair. Drag a booking to move it, drag its bottom edge to resize it, or focus it and use the arrow keys; a colour's processing time leaves the chair free.",
  label: "Salon bookings, Monday",
  hint: "Arrow up and down move the booking by 15 minutes, with Shift they resize it; arrow left and right move it to another chair.",
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
  {
    id: "lunch",
    title: "Lunch",
    day: DAY,
    resource: "lina",
    start: 780,
    end: 840,
    isMovable: false,
  },
];

/** A minute from midnight as `HH:MM`, on a 24-hour clock. */
const formatMinute = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/** The Resource scheduler page. */
export function ProResourceScheduler() {
  const [events, setEvents] = useState<readonly SchedulerEvent[]>(BOOKINGS);
  const [last, setLast] = useState("");
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProResourceSchedulerRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="max-w-3xl">
        <UiPro.ResourceScheduler
          label={STRINGS.label}
          view="day"
          days={[DAY]}
          resources={RESOURCES}
          startMinute={540}
          endMinute={1080}
          slotMinutes={15}
          events={events}
          onEventChange={(changed) => {
            setEvents((all) => all.map((event) => (event.id === changed.id ? changed : event)));
            setLast(STRINGS.moved(changed.title));
          }}
          formatMinute={formatMinute}
          formatDay={(day) =>
            new Date(`${day}T00:00:00Z`).toLocaleDateString("en", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })
          }
          keyboardHint={STRINGS.hint}
        />
      </div>
      <p role="status" className="text-sm text-muted">
        {last}
      </p>
    </article>
  );
}
