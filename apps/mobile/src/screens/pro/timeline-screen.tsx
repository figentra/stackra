/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Timeline` (@stackra-pro/ui): an order chronology, each item
 *          status, a leading time column, and the small compact size.
 * Boundary: presentation only; the timeline is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Timeline } from "@stackra-pro/ui/native";
import { Text } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Chronology",
    description:
      "Each item has a marker tinted by its `status` and a connector to the previous one.",
    items: [
      { status: "success", title: "Order placed", detail: "We received your order." },
      { status: "success", title: "Payment confirmed", detail: "Paid by card ending 4242." },
      { status: "current", title: "Processing", detail: "Preparing your items." },
      { status: "default", title: "Shipped", detail: "Not shipped yet." },
    ],
  },
  statuses: {
    title: "Statuses",
    description: "`status`: `default`, `muted`, `current`, `success`, `warning` and `danger`.",
    items: ["default", "muted", "current", "success", "warning", "danger"],
  },
  leading: {
    title: "Leading column",
    description: "`Timeline.Leading` puts a time or other short text left of the rail.",
    items: [
      { time: "09:12", title: "Feature flag created" },
      { time: "09:40", title: "Rolled out to 10%" },
      { time: "11:05", title: "Rolled out to everyone" },
    ],
  },
  compact: {
    title: "Small and compact",
    description: "`size` scales markers and text; `density` tightens the space between items.",
    items: [
      { status: "success", title: "Build passed" },
      { status: "current", title: "Deploying" },
      { status: "default", title: "Smoke tests" },
    ],
  },
} as const;

/** The Timeline page: one section per feature, in a scrollable screen. */
export function TimelineScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <Timeline>
          {STRINGS.basic.items.map(({ status, title, detail }) => (
            <Timeline.Item key={title} status={status}>
              <Timeline.Rail />
              <Timeline.Content>
                <Timeline.Title>{title}</Timeline.Title>
                <Timeline.Description>{detail}</Timeline.Description>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>

      <Section title={STRINGS.statuses.title} description={STRINGS.statuses.description}>
        <Timeline>
          {STRINGS.statuses.items.map((status) => (
            <Timeline.Item key={status} status={status}>
              <Timeline.Rail />
              <Timeline.Content>
                <Timeline.Title>{status}</Timeline.Title>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>

      <Section title={STRINGS.leading.title} description={STRINGS.leading.description}>
        <Timeline>
          {STRINGS.leading.items.map(({ time, title }) => (
            <Timeline.Item key={title} align="center" status="default">
              <Timeline.Leading>
                <Text className="text-sm text-muted">{time}</Text>
              </Timeline.Leading>
              <Timeline.Rail />
              <Timeline.Content>
                <Timeline.Title>{title}</Timeline.Title>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>

      <Section title={STRINGS.compact.title} description={STRINGS.compact.description}>
        <Timeline size="sm" density="compact">
          {STRINGS.compact.items.map(({ status, title }) => (
            <Timeline.Item key={title} status={status}>
              <Timeline.Rail />
              <Timeline.Content>
                <Timeline.Title>{title}</Timeline.Title>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>
    </Screen>
  );
}
