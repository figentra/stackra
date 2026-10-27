/**
 * Stackra file contract:
 * Purpose: the page of the Timeline route: `@stackra-pro/ui`'s Timeline as a release log of five events, each with a
 *          marker, a title, a status chip that says its state in words, a description and a time, the current event
 *          marked, in a compact density.
 * Boundary: presentation only; the events are local. The markers are decorative (hidden from assistive technology), so
 *          every state is also in text.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Chip } from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";
import { ProTimelineRoute } from "#src/routes/pro-timeline/pro-timeline.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-timeline.*` keys.
const STRINGS = {
  documentTitle: `${ProTimelineRoute.title} · Stackra Playground`,
  intro:
    "A read-only chronology: each event has a marker, a title, a state and a time, and the current event is marked for assistive technology.",
  log: "Release log",
  list: "Checkout redesign rollout",
} as const;

/** One event of the log. */
interface LogEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly state: string;
  readonly time: string;
  readonly icon: DemoIconName;
  readonly status: "default" | "current" | "warning" | "muted" | "success";
  readonly color: "default" | "accent" | "warning" | "success";
}

const EVENTS: readonly LogEvent[] = [
  {
    id: "flag",
    title: "Feature flag created",
    description: "Created checkout-redesign for the billing workspace.",
    state: "Done",
    time: "09:12",
    icon: "gear",
    status: "default",
    color: "default",
  },
  {
    id: "canary",
    title: "Canary rollout started",
    description: "Enabled for 5% of workspaces with session replay sampling on.",
    state: "In progress",
    time: "09:34",
    icon: "chart",
    status: "current",
    color: "accent",
  },
  {
    id: "guardrail",
    title: "Regional guardrail tripped",
    description: "Latency climbed in one region; the rollout is holding while routing warms.",
    state: "Paused",
    time: "09:51",
    icon: "search",
    status: "warning",
    color: "warning",
  },
  {
    id: "window",
    title: "Launch window scheduled",
    description: "Full rollout waits for the next error-budget sweep.",
    state: "Queued",
    time: "10:30",
    icon: "home",
    status: "muted",
    color: "default",
  },
  {
    id: "checklist",
    title: "Release checklist verified",
    description: "Rollback owner and dashboard checks are recorded in the release audit.",
    state: "Ready",
    time: "10:42",
    icon: "doc",
    status: "success",
    color: "success",
  },
];

/** The Timeline page. */
export function ProTimeline() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProTimelineRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="log-heading" className="grid max-w-xl gap-3">
        <h2 id="log-heading" className="type-h2">
          {STRINGS.log}
        </h2>
        <UiPro.Timeline aria-label={STRINGS.list} density="compact">
          {EVENTS.map((event) => (
            <UiPro.Timeline.Item key={event.id} status={event.status}>
              <UiPro.Timeline.Rail>
                <UiPro.Timeline.Marker aria-hidden="true">
                  <DemoIcon name={event.icon} />
                </UiPro.Timeline.Marker>
                <UiPro.Timeline.Connector />
              </UiPro.Timeline.Rail>
              <UiPro.Timeline.Content>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">{event.title}</h3>
                  <Chip tone={event.color} size="sm" variant="soft">
                    {event.state}
                  </Chip>
                  <time className="text-xs text-muted">{event.time}</time>
                </div>
                <p className="text-sm text-muted">
                  <bdi>{event.description}</bdi>
                </p>
              </UiPro.Timeline.Content>
            </UiPro.Timeline.Item>
          ))}
        </UiPro.Timeline>
      </section>
    </article>
  );
}
