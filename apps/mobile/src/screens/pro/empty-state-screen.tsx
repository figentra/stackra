/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `EmptyState` (@stackra/ui-pro): title and description only,
 *          with an icon-style media block, with an action, and inside a dashed border.
 * Boundary: presentation and local demo state only; the empty state is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { EmptyState } from "@stackra/ui-pro/native";
import { Button, Typography } from "heroui-native";
import { useState } from "react";
import { Text } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Title and description",
    description: "The smallest empty state: a centred heading and a muted line.",
    heading: "Inbox zero",
    body: "You have read everything. New messages will show up here.",
  },
  media: {
    title: "With media",
    description: '`variant="icon"` puts the media in a round muted surface.',
    heading: "No notifications yet",
    body: "When something needs your attention it will appear here.",
  },
  action: {
    title: "With an action",
    description: "`EmptyState.Content` holds the controls below the header.",
    heading: "No matches found",
    body: "Try a different word or clear the search.",
    clear: "Clear search",
    cleared: "Search cleared.",
    waiting: "Search not cleared yet.",
  },
  bordered: {
    title: "Bordered",
    description: "A dashed border on the root outlines the empty area.",
    heading: "Start your first automation",
    body: "Automations run your routine tasks for you.",
    start: "Get started",
  },
} as const;

/** A bell shape for the media block; decorative, so hidden from screen readers. */
function Glyph() {
  return (
    <Text accessible={false} className="text-xl text-muted">
      ★
    </Text>
  );
}

/** The EmptyState page: one section per composition, in a scrollable screen. */
export function EmptyStateScreen() {
  const [isCleared, setIsCleared] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{STRINGS.basic.heading}</EmptyState.Title>
            <EmptyState.Description>{STRINGS.basic.body}</EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </Section>

      <Section title={STRINGS.media.title} description={STRINGS.media.description}>
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Glyph />
            </EmptyState.Media>
            <EmptyState.Title>{STRINGS.media.heading}</EmptyState.Title>
            <EmptyState.Description>{STRINGS.media.body}</EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </Section>

      <Section title={STRINGS.action.title} description={STRINGS.action.description}>
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{STRINGS.action.heading}</EmptyState.Title>
            <EmptyState.Description>{STRINGS.action.body}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button variant="outline" onPress={() => setIsCleared(true)}>
              {STRINGS.action.clear}
            </Button>
          </EmptyState.Content>
        </EmptyState>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {isCleared ? STRINGS.action.cleared : STRINGS.action.waiting}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.bordered.title} description={STRINGS.bordered.description}>
        <EmptyState className="rounded-2xl border border-dashed border-border">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Glyph />
            </EmptyState.Media>
            <EmptyState.Title>{STRINGS.bordered.heading}</EmptyState.Title>
            <EmptyState.Description>{STRINGS.bordered.body}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="outline">
              {STRINGS.bordered.start}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </Section>
    </Screen>
  );
}
