/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Segment` (@stackra/ui-pro): a controlled segmented control
 *          with the choice read back, the three sizes, separators between items, a horizontally scrolling row, a
 *          single disabled item, and the whole control disabled.
 * Boundary: presentation and local demo state only; the control is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Segment } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description: "The indicator slides to the picked item.",
    name: "Report view",
    value: "Selected:",
  },
  sizes: {
    title: "Sizes",
    description: "`size` scales padding, radius and text across every part.",
    sm: "Small size",
    md: "Medium size",
    lg: "Large size",
  },
  separators: {
    title: "Separators",
    description: "A divider between items hides while either neighbour is selected.",
    name: "Report view with separators",
  },
  scroll: {
    title: "Scrollable",
    description:
      "`Segment.ScrollView` scrolls the row when the items overflow and centres the picked one.",
    name: "Report sections",
  },
  disabledItem: {
    title: "Disabled item",
    description: "An item's own `isDisabled` blocks only that item.",
    name: "Report view, one item unavailable",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` on the root blocks every item.",
    name: "Report view, unavailable",
  },
  items: {
    dashboard: "Dashboard",
    analytics: "Analytics",
    reports: "Reports",
    settings: "Settings",
    exports: "Exports",
    billing: "Billing",
  },
} as const;

/** The two items most demos share. */
function BasicItems() {
  return (
    <>
      <Segment.Item value="dashboard">
        <Segment.Label>{STRINGS.items.dashboard}</Segment.Label>
      </Segment.Item>
      <Segment.Item value="analytics">
        <Segment.Label>{STRINGS.items.analytics}</Segment.Label>
      </Segment.Item>
    </>
  );
}

/** The Segment page: one section per size, layout and state, in a scrollable screen. */
export function SegmentScreen() {
  const [view, setView] = useState("dashboard");

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Segment value={view} onValueChange={setView}>
          <Segment.Group label={STRINGS.controlled.name}>
            <Segment.Indicator />
            <BasicItems />
          </Segment.Group>
        </Segment>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${view}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <Segment size="sm" defaultValue="dashboard">
          <Segment.Group label={STRINGS.sizes.sm}>
            <Segment.Indicator />
            <BasicItems />
          </Segment.Group>
        </Segment>
        <Segment size="md" defaultValue="dashboard">
          <Segment.Group label={STRINGS.sizes.md}>
            <Segment.Indicator />
            <BasicItems />
          </Segment.Group>
        </Segment>
        <Segment size="lg" defaultValue="dashboard">
          <Segment.Group label={STRINGS.sizes.lg}>
            <Segment.Indicator />
            <BasicItems />
          </Segment.Group>
        </Segment>
      </Section>

      <Section title={STRINGS.separators.title} description={STRINGS.separators.description}>
        <Segment defaultValue="dashboard">
          <Segment.Group label={STRINGS.separators.name}>
            <Segment.Indicator />
            <Segment.Item value="dashboard">
              <Segment.Label>{STRINGS.items.dashboard}</Segment.Label>
            </Segment.Item>
            <Segment.Separator betweenValues={["dashboard", "analytics"]} />
            <Segment.Item value="analytics">
              <Segment.Label>{STRINGS.items.analytics}</Segment.Label>
            </Segment.Item>
            <Segment.Separator betweenValues={["analytics", "reports"]} />
            <Segment.Item value="reports">
              <Segment.Label>{STRINGS.items.reports}</Segment.Label>
            </Segment.Item>
          </Segment.Group>
        </Segment>
      </Section>

      <Section title={STRINGS.scroll.title} description={STRINGS.scroll.description}>
        <Segment defaultValue="dashboard">
          <Segment.Group label={STRINGS.scroll.name}>
            <Segment.ScrollView>
              <Segment.Indicator />
              <Segment.Item value="dashboard">
                <Segment.Label>{STRINGS.items.dashboard}</Segment.Label>
              </Segment.Item>
              <Segment.Item value="analytics">
                <Segment.Label>{STRINGS.items.analytics}</Segment.Label>
              </Segment.Item>
              <Segment.Item value="reports">
                <Segment.Label>{STRINGS.items.reports}</Segment.Label>
              </Segment.Item>
              <Segment.Item value="settings">
                <Segment.Label>{STRINGS.items.settings}</Segment.Label>
              </Segment.Item>
              <Segment.Item value="exports">
                <Segment.Label>{STRINGS.items.exports}</Segment.Label>
              </Segment.Item>
              <Segment.Item value="billing">
                <Segment.Label>{STRINGS.items.billing}</Segment.Label>
              </Segment.Item>
            </Segment.ScrollView>
          </Segment.Group>
        </Segment>
      </Section>

      <Section title={STRINGS.disabledItem.title} description={STRINGS.disabledItem.description}>
        <Segment defaultValue="dashboard">
          <Segment.Group label={STRINGS.disabledItem.name}>
            <Segment.Indicator />
            <Segment.Item value="dashboard">
              <Segment.Label>{STRINGS.items.dashboard}</Segment.Label>
            </Segment.Item>
            <Segment.Item value="analytics" isDisabled>
              <Segment.Label>{STRINGS.items.analytics}</Segment.Label>
            </Segment.Item>
            <Segment.Item value="reports">
              <Segment.Label>{STRINGS.items.reports}</Segment.Label>
            </Segment.Item>
          </Segment.Group>
        </Segment>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <Segment defaultValue="dashboard" isDisabled>
          <Segment.Group label={STRINGS.disabled.name}>
            <Segment.Indicator />
            <BasicItems />
          </Segment.Group>
        </Segment>
      </Section>
    </Screen>
  );
}
