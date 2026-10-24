/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Carousel` (@stackra/ui-pro): one slide per view with
 *          buttons and dots, several slides per view with the next one peeking, and side padding.
 * Boundary: presentation and demo data only; the carousel is @stackra/ui-pro's, the slides use theme classes.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Heading, Text } from "@stackra/ui/native";
import { Carousel } from "@stackra/ui-pro/native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  single: {
    title: "One slide per view",
    description:
      "Swipe, or use the previous and next buttons; the dots show the position and the ends disable a button.",
    label: "Featured destinations",
  },
  peek: {
    title: "Several slides per view",
    description: "A fractional `itemsPerView` lets the next slide peek; `gap` spaces the slides.",
    label: "Trending destinations",
  },
  padding: {
    title: "Side padding",
    description: "`sidePadding` insets the first and last slide without clipping the strip.",
    label: "Saved destinations",
  },
} as const;

const SLIDES = [
  { id: "kyoto", title: "Kyoto", detail: "5 nights" },
  { id: "lisbon", title: "Lisbon", detail: "3 nights" },
  { id: "cairo", title: "Cairo", detail: "4 nights" },
  { id: "oslo", title: "Oslo", detail: "2 nights" },
];

/** The slides of every demo: a tinted card with the place and the length of the stay. */
function slides() {
  return SLIDES.map((slide) => (
    <Carousel.Item
      key={slide.id}
      className="aspect-[4/3] justify-end rounded-3xl bg-accent-soft p-5"
    >
      <View className="gap-1">
        <Heading level={4} className="text-accent-soft-foreground">
          {slide.title}
        </Heading>
        <Text type="small" className="text-accent-soft-foreground">
          {slide.detail}
        </Text>
      </View>
    </Carousel.Item>
  ));
}

/** The Carousel page: one section per layout, in a scrollable screen. */
export function CarouselScreen() {
  return (
    <Screen>
      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <Carousel label={STRINGS.single.label}>
          <Carousel.Content>{slides()}</Carousel.Content>
          <Carousel.Previous />
          <Carousel.Next />
          <Carousel.Dots />
        </Carousel>
      </Section>

      <Section title={STRINGS.peek.title} description={STRINGS.peek.description}>
        <Carousel label={STRINGS.peek.label} itemsPerView={1.2} gap={12} align="center">
          <Carousel.Content>{slides()}</Carousel.Content>
          <Carousel.Dots />
        </Carousel>
      </Section>

      <Section title={STRINGS.padding.title} description={STRINGS.padding.description}>
        <Carousel label={STRINGS.padding.label} itemsPerView={1.15} sidePadding={20} align="center">
          <Carousel.Content>{slides()}</Carousel.Content>
          <Carousel.Dots />
        </Carousel>
      </Section>
    </Screen>
  );
}
