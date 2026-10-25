/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `FlipCard` (@stackra-pro/ui): a tap-to-flip card, the vertical
 *          direction, a card flipped from a button, and one that ignores taps.
 * Boundary: presentation and local demo state only; the card is @stackra-pro/ui's, the faces use theme classes.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Button, Heading, Text } from "@stackra/ui/native";
import { FlipCard } from "@stackra-pro/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Tap to flip",
    description: "A tap turns the card around the vertical axis with a spring.",
    label: "Trip card, tap to flip",
    frontTitle: "Kyoto Getaway",
    frontDetail: "5 nights",
    backTitle: "Trip details",
    backDetail: "Flights, hotel and a rail pass for 1,240.",
  },
  vertical: {
    title: "Vertical",
    description: '`direction="vertical"` turns the card top over bottom.',
    label: "Cairo card, tap to flip vertically",
    frontTitle: "Cairo Weekend",
    frontDetail: "3 nights",
    backTitle: "Trip details",
    backDetail: "Flights and a guided old-town walk for 690.",
  },
  controlled: {
    title: "Controlled",
    description:
      "`isFlipped` and `onFlipChange` drive the card; `isPressDisabled` stops the tap from flipping it.",
    label: "Lisbon card, flipped by the button",
    frontTitle: "Lisbon City Break",
    frontDetail: "Use the button to see the price.",
    backTitle: "Price",
    backDetail: "From 540 per person.",
    show: "Show price",
    hide: "Show trip",
    state: "Showing:",
    front: "trip",
    back: "price",
  },
} as const;

/** The two faces of a demo card: a title and a detail line on a themed surface. */
function Face({ title, detail }: { title: string; detail: string }) {
  return (
    <View className="flex-1 justify-end gap-1 p-6">
      <Heading level={4}>{title}</Heading>
      <Text type="small" tone="muted">
        {detail}
      </Text>
    </View>
  );
}

/** The FlipCard page: one section per direction and control, in a scrollable screen. */
export function FlipCardScreen() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <FlipCard label={STRINGS.basic.label} className="aspect-[1.6]">
          <FlipCard.Front className="bg-accent-soft">
            <Face title={STRINGS.basic.frontTitle} detail={STRINGS.basic.frontDetail} />
          </FlipCard.Front>
          <FlipCard.Back className="bg-surface-secondary">
            <Face title={STRINGS.basic.backTitle} detail={STRINGS.basic.backDetail} />
          </FlipCard.Back>
        </FlipCard>
      </Section>

      <Section title={STRINGS.vertical.title} description={STRINGS.vertical.description}>
        <FlipCard label={STRINGS.vertical.label} direction="vertical" className="aspect-[1.6]">
          <FlipCard.Front className="bg-accent-soft">
            <Face title={STRINGS.vertical.frontTitle} detail={STRINGS.vertical.frontDetail} />
          </FlipCard.Front>
          <FlipCard.Back className="bg-surface-secondary">
            <Face title={STRINGS.vertical.backTitle} detail={STRINGS.vertical.backDetail} />
          </FlipCard.Back>
        </FlipCard>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <FlipCard
          label={STRINGS.controlled.label}
          isFlipped={isFlipped}
          onFlipChange={setIsFlipped}
          isPressDisabled
          className="aspect-[1.6]"
        >
          <FlipCard.Front className="bg-accent-soft">
            <Face title={STRINGS.controlled.frontTitle} detail={STRINGS.controlled.frontDetail} />
          </FlipCard.Front>
          <FlipCard.Back className="bg-surface-secondary">
            <Face title={STRINGS.controlled.backTitle} detail={STRINGS.controlled.backDetail} />
          </FlipCard.Back>
        </FlipCard>
        <View className="flex-row items-center justify-between gap-3">
          <Text type="small" tone="muted" accessibilityLiveRegion="polite">
            {`${STRINGS.controlled.state} ${isFlipped ? STRINGS.controlled.back : STRINGS.controlled.front}`}
          </Text>
          <Button size="sm" variant="secondary" onPress={() => setIsFlipped((flipped) => !flipped)}>
            {isFlipped ? STRINGS.controlled.hide : STRINGS.controlled.show}
          </Button>
        </View>
      </Section>
    </Screen>
  );
}
