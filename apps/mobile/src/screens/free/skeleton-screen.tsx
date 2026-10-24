/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Skeleton` and `SkeletonGroup` (@stackra/ui): each animation,
 *          the shapes a class gives a bone, one sweep across a group against three lone bones, and a live profile
 *          that loads for a moment and then shows its content.
 * Boundary: presentation and local demo state only; the placeholders are @stackra/ui's, their shapes are classes.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { SkeletonAnimation } from "@stackra/ui/contracts";
import { Avatar, Button, Card, Skeleton, SkeletonGroup, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** How long the live profile loads, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  animations: {
    title: "Animations",
    description: "`animationType`: a shimmering sweep, a slow pulse and a still placeholder.",
  },
  shapes: {
    title: "Shapes",
    description:
      "Shape and size come from the class alone: lines, an avatar, a media block and a button.",
  },
  sweep: {
    title: "One sweep",
    description:
      "A `SkeletonGroup` draws one sweep over all its bones; three lone bones each draw their own.",
    grouped: "Group",
    lone: "Lone",
  },
  cycle: {
    title: "Loading to content",
    description:
      "Reload the profile: the placeholder shows for a moment, then the content is back.",
    loading: "Loading profile",
    reload: "Reload",
    name: "Ada Lovelace",
    handle: "@ada",
  },
} as const;

/** The Skeleton page: one section per option, in a scrollable screen. */
export function SkeletonScreen() {
  const [isLoading, setIsLoading] = useState(true);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <Screen>
      <Section title={STRINGS.animations.title} description={STRINGS.animations.description}>
        {SkeletonAnimation.map((animation) => (
          <Sample key={animation} caption={animation}>
            <Card className="w-full">
              <SkeletonGroup animationType={animation} className="gap-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </SkeletonGroup>
            </Card>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.shapes.title} description={STRINGS.shapes.description}>
        <View className="flex-row items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-3 w-2/3 rounded-md" />
          </View>
        </View>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </Section>

      <Section title={STRINGS.sweep.title} description={STRINGS.sweep.description}>
        <Sample caption={STRINGS.sweep.grouped}>
          <SkeletonGroup className="flex-row gap-2">
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
          </SkeletonGroup>
        </Sample>
        <Sample caption={STRINGS.sweep.lone}>
          <View className="flex-row gap-2">
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
          </View>
        </Sample>
      </Section>

      <Section title={STRINGS.cycle.title} description={STRINGS.cycle.description}>
        <Card>
          <SkeletonGroup
            isLoading={isLoading}
            loadingLabel={STRINGS.cycle.loading}
            className="flex-row items-center gap-3"
          >
            <Skeleton className="size-12 rounded-full">
              <Avatar name={STRINGS.cycle.name} size="lg" />
            </Skeleton>
            <View className="flex-1 gap-1">
              <Skeleton className="h-4 w-32 rounded-md">
                <Text>{STRINGS.cycle.name}</Text>
              </Skeleton>
              <Skeleton className="h-3 w-16 rounded-md">
                <Text type="small" tone="muted">
                  {STRINGS.cycle.handle}
                </Text>
              </Skeleton>
            </View>
          </SkeletonGroup>
        </Card>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={isLoading}
          onPress={() => setIsLoading(true)}
        >
          {STRINGS.cycle.reload}
        </Button>
      </Section>
    </Screen>
  );
}
