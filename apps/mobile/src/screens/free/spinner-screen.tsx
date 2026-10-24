/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Spinner` (@stackra/ui): the sizes, every tone, a decorative
 *          spinner beside the text that names the wait, and a labelled spinner a button starts and stops.
 * Boundary: presentation and local demo state only; the spinner is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Size, TextTone } from "@stackra/ui/contracts";
import { Button, Spinner, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** How long the live load runs, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  sizes: {
    title: "Sizes",
    description: "`sm`, `md` and `lg`: 16, 24 and 32 points, as on web.",
    label: (size: string) => `Loading, ${size}`,
  },
  tones: {
    title: "Tones",
    description: "One spinner per `tone`; `accent` is the default.",
    label: (tone: string) => `Loading, ${tone}`,
  },
  beside: {
    title: "Beside text",
    description: "A decorative spinner, without `label`: the text next to it carries the meaning.",
    results: "Loading results…",
  },
  action: {
    title: "Start and stop",
    description:
      "Press the button: a labelled spinner shows for a moment, then its result is announced.",
    load: "Load orders",
    loading: "Loading orders",
    loaded: "Orders loaded",
  },
} as const;

/** The Spinner page: one section per option, in a scrollable screen. */
export function SpinnerScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => {
      setIsLoading(false);
      setHasLoaded(true);
    }, LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <Screen>
      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row flex-wrap items-end gap-6">
          {Size.map((size) => (
            <Sample key={size} caption={size}>
              <Spinner size={size} label={STRINGS.sizes.label(size)} />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        <View className="flex-row flex-wrap gap-6">
          {TextTone.map((tone) => (
            <Sample key={tone} caption={tone}>
              <Spinner tone={tone} label={STRINGS.tones.label(tone)} />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.beside.title} description={STRINGS.beside.description}>
        <View className="flex-row items-center gap-2">
          <Spinner size="sm" tone="muted" />
          <Text tone="muted">{STRINGS.beside.results}</Text>
        </View>
      </Section>

      <Section title={STRINGS.action.title} description={STRINGS.action.description}>
        <View className="flex-row items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={isLoading}
            onPress={() => {
              setHasLoaded(false);
              setIsLoading(true);
            }}
          >
            {STRINGS.action.load}
          </Button>
          {isLoading ? <Spinner size="sm" label={STRINGS.action.loading} /> : null}
          <Text tone="muted" accessibilityLiveRegion="polite">
            {hasLoaded ? STRINGS.action.loaded : ""}
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
