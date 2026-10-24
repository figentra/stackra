/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Card` (@stackra/ui): one card per surface level, the anatomy
 *          (header, title, description, content, footer), nested title levels, and a dismissible card.
 * Boundary: presentation and local demo state only; the card is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Button, Card, CloseButton, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  levels: {
    title: "Levels",
    description:
      "`variant`: one card per surface level. The transparent card drops the background and the shadow.",
    cardTitle: (level: string) => `Level ${level}`,
    cardDescription: "A short description under the title.",
    content: "The content of the card.",
  },
  anatomy: {
    title: "Anatomy",
    description: "Header with title and description, content, and a footer with the actions.",
    cardTitle: "Invoice 1042",
    cardDescription: "Due on the first of next month.",
    content: "Three line items, one reminder sent, no payment yet.",
    pay: "Pay now",
    later: "Remind me later",
  },
  titleLevels: {
    title: "Title levels",
    description:
      "`Card.Title` takes `level`, its place in the outline: 3 here and 4 for the card inside. The look stays the same.",
    outerTitle: "Subscription",
    outerDescription: "Your plan and what it includes.",
    innerTitle: "Add-ons",
    innerContent: "Two add-ons are active.",
  },
  dismissible: {
    title: "Dismissible",
    description: "Dismiss the card to hide it; Show again brings it back.",
    cardTitle: "Your changes were saved",
    content: "You can close this card at any time.",
    dismiss: "Dismiss card",
    showAgain: "Show again",
    hidden: "The card is hidden.",
  },
} as const;

/** The Card page: one section per option, in a scrollable screen. */
export function CardScreen() {
  const [isShown, setIsShown] = useState(true);

  return (
    <Screen>
      <Section title={STRINGS.levels.title} description={STRINGS.levels.description}>
        {SurfaceVariant.map((variant) => (
          <Card key={variant} variant={variant}>
            <Card.Header>
              <Card.Title>{STRINGS.levels.cardTitle(variant)}</Card.Title>
              <Card.Description>{STRINGS.levels.cardDescription}</Card.Description>
            </Card.Header>
            <Card.Content>
              <Text>{STRINGS.levels.content}</Text>
            </Card.Content>
          </Card>
        ))}
      </Section>

      <Section title={STRINGS.anatomy.title} description={STRINGS.anatomy.description}>
        <Card>
          <Card.Header>
            <Card.Title>{STRINGS.anatomy.cardTitle}</Card.Title>
            <Card.Description>{STRINGS.anatomy.cardDescription}</Card.Description>
          </Card.Header>
          <Card.Content>
            <Text>{STRINGS.anatomy.content}</Text>
          </Card.Content>
          <Card.Footer className="flex-row flex-wrap gap-2">
            <Button size="sm">{STRINGS.anatomy.pay}</Button>
            <Button size="sm" variant="tertiary">
              {STRINGS.anatomy.later}
            </Button>
          </Card.Footer>
        </Card>
      </Section>

      <Section title={STRINGS.titleLevels.title} description={STRINGS.titleLevels.description}>
        <Card>
          <Card.Header>
            <Card.Title level={3}>{STRINGS.titleLevels.outerTitle}</Card.Title>
            <Card.Description>{STRINGS.titleLevels.outerDescription}</Card.Description>
          </Card.Header>
          <Card.Content>
            <Card variant="secondary">
              <Card.Header>
                <Card.Title level={4}>{STRINGS.titleLevels.innerTitle}</Card.Title>
              </Card.Header>
              <Card.Content>
                <Text>{STRINGS.titleLevels.innerContent}</Text>
              </Card.Content>
            </Card>
          </Card.Content>
        </Card>
      </Section>

      <Section title={STRINGS.dismissible.title} description={STRINGS.dismissible.description}>
        {isShown ? (
          <Card>
            <Card.Header className="flex-row items-start justify-between gap-2">
              <Card.Title className="flex-1">{STRINGS.dismissible.cardTitle}</Card.Title>
              <CloseButton label={STRINGS.dismissible.dismiss} onPress={() => setIsShown(false)} />
            </Card.Header>
            <Card.Content>
              <Text>{STRINGS.dismissible.content}</Text>
            </Card.Content>
          </Card>
        ) : (
          <View className="items-start gap-2">
            <Text tone="muted" accessibilityLiveRegion="polite">
              {STRINGS.dismissible.hidden}
            </Text>
            <Button size="sm" variant="secondary" onPress={() => setIsShown(true)}>
              {STRINGS.dismissible.showAgain}
            </Button>
          </View>
        )}
      </Section>
    </Screen>
  );
}
