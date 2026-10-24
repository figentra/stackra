/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `IconButton` (@stackra/ui): every variant in every size, the
 *          disabled and loading states, and a live counter beside a button that loads for a moment.
 * Boundary: presentation and local demo state only; the button is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { IconButton, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** How long the live load holds its press, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants and sizes",
    description:
      "One row per size, one button per variant. `label` is required: it is the only name.",
    size: (size: string) => `Size ${size}`,
    settings: (variant: string) => `Settings, ${variant}`,
    delete: (variant: string) => `Delete, ${variant}`,
  },
  states: {
    title: "States",
    description:
      "`isDisabled`, and `isLoading`: the icon gives way to a spinner and the size stays.",
    disabled: "Settings (disabled)",
    loading: "Settings (loading)",
  },
  live: {
    title: "Try it",
    description: "Press the first button to count; the second holds its press for a moment.",
    count: "Count presses",
    load: "Load",
    presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
    loadState: (isLoading: boolean) => (isLoading ? "Loading…" : "Idle."),
  },
} as const;

/** The IconButton page: one section per option, in a scrollable screen. */
export function IconButtonScreen() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        {Size.map((size) => (
          <Sample key={size} caption={STRINGS.variants.size(size)}>
            <View className="flex-row flex-wrap gap-2">
              {ButtonVariant.map((variant) => (
                <IconButton
                  key={variant}
                  icon={variant.startsWith("danger") ? "trash" : "settings"}
                  label={
                    variant.startsWith("danger")
                      ? STRINGS.variants.delete(variant)
                      : STRINGS.variants.settings(variant)
                  }
                  variant={variant}
                  size={size}
                />
              ))}
            </View>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <View className="flex-row flex-wrap gap-6">
          <Sample caption="isDisabled">
            <IconButton icon="settings" label={STRINGS.states.disabled} isDisabled />
          </Sample>
          <Sample caption="isLoading">
            <IconButton icon="settings" label={STRINGS.states.loading} isLoading />
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="flex-row items-center gap-3">
          <IconButton
            icon="plus"
            label={STRINGS.live.count}
            onPress={() => setCount((value) => value + 1)}
          />
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.live.presses(count)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <IconButton
            icon="download"
            label={STRINGS.live.load}
            variant="secondary"
            isLoading={isLoading}
            onPress={() => setIsLoading(true)}
          />
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.live.loadState(isLoading)}
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
