/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `PageSkeleton` (@stackra/ui): the placeholders of each layout
 *          (a page, a table, a section and a form), each way they move, and a live page that loads for a moment and
 *          then shows its content.
 * Boundary: presentation and local demo state only; the placeholders are @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { PageSkeletonLayout, SkeletonAnimation } from "@stackra/ui/contracts";
import { Button, Card, PageSkeleton, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** How long the live page loads, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  layouts: {
    title: "Layouts",
    description:
      "`layout`: the shape of what loads. `loadingLabel` is the one phrase a screen reader says while it does.",
    caption: (layout: string) => `layout="${layout}"`,
    label: (layout: string) => `Loading the ${layout}`,
  },
  animations: {
    title: "Animations",
    description: "`animationType`: a shimmering sweep, a slow pulse and a still placeholder.",
    caption: (animation: string) => `animationType="${animation}"`,
    label: (animation: string) => `Loading with the ${animation} animation`,
  },
  live: {
    title: "Try it",
    description: "Reload the page: the placeholders show for a moment, then the content is back.",
    loading: "Loading the report",
    heading: "Quarterly report",
    body: "Revenue grew by 12 percent, and three regions beat their targets.",
    reload: "Reload",
  },
} as const;

/** The PageSkeleton page: one section per option, in a scrollable screen. */
export function PageSkeletonScreen() {
  const [isLoading, setIsLoading] = useState(true);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <Screen>
      <Section title={STRINGS.layouts.title} description={STRINGS.layouts.description}>
        {PageSkeletonLayout.map((layout) => (
          <Sample key={layout} caption={STRINGS.layouts.caption(layout)}>
            <PageSkeleton layout={layout} loadingLabel={STRINGS.layouts.label(layout)} />
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.animations.title} description={STRINGS.animations.description}>
        {SkeletonAnimation.map((animation) => (
          <Sample key={animation} caption={STRINGS.animations.caption(animation)}>
            <PageSkeleton
              layout="section"
              animationType={animation}
              loadingLabel={STRINGS.animations.label(animation)}
            />
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        {isLoading ? (
          <PageSkeleton layout="section" loadingLabel={STRINGS.live.loading} />
        ) : (
          <Card>
            <Card.Header>
              <Card.Title>{STRINGS.live.heading}</Card.Title>
            </Card.Header>
            <Card.Content>
              <Text accessibilityLiveRegion="polite">{STRINGS.live.body}</Text>
            </Card.Content>
          </Card>
        )}
        <Button
          size="sm"
          variant="secondary"
          isDisabled={isLoading}
          onPress={() => setIsLoading(true)}
        >
          {STRINGS.live.reload}
        </Button>
      </Section>
    </Screen>
  );
}
