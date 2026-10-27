/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Chip` (@stackra/ui): every variant in every tone, per size,
 *          start, end and both icons, chips in context, and a live chip that steps through variants and tones.
 * Boundary: presentation and local demo state only; the chip is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Enum, Tone } from "@stackra/contracts";
import { ChipVariant, Size } from "@stackra/ui/contracts";
import { Button, Chip, Icon, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  matrix: {
    title: "Variants and tones",
    description:
      "One block per size: a row per variant, a chip per tone, each chip labelled with its tone.",
    size: (size: string, variant: string) => `Size ${size}, ${variant}`,
  },
  icons: {
    title: "Icons",
    description:
      "`startIcon`, an `endIcon` that mirrors in right-to-left, and both. Icons are the size of the text.",
    start: "Verified",
    end: "Open",
    both: "Approved",
  },
  context: {
    title: "In context",
    description: "A chip beside a sentence, and a row of category chips.",
    sentencePrefix: "This order is",
    sentenceChip: "On track",
    sentenceSuffix: "and ships tomorrow.",
    categories: ["Design", "Engineering", "Support"],
  },
  live: {
    title: "Try it",
    description: "Step through the variants and the tones; the chip shows what it is.",
    nextVariant: "Next variant",
    nextTone: "Next tone",
    current: (variant: string, tone: string) => `${variant}, ${tone}`,
  },
} as const;

/** The Chip page: one section per option, in a scrollable screen. */
export function ChipScreen() {
  const [variantIndex, setVariantIndex] = useState(0);
  const [toneIndex, setToneIndex] = useState(0);
  const variant = ChipVariant[variantIndex % ChipVariant.length] ?? "secondary";
  const tone = Enum.values(Tone)[toneIndex % Enum.values(Tone).length] ?? "default";

  return (
    <Screen>
      <Section title={STRINGS.matrix.title} description={STRINGS.matrix.description}>
        {Size.map((size) =>
          ChipVariant.map((chipVariant) => (
            <Sample key={`${size}-${chipVariant}`} caption={STRINGS.matrix.size(size, chipVariant)}>
              <View className="flex-row flex-wrap gap-2">
                {Enum.values(Tone).map((chipTone) => (
                  <Chip key={chipTone} size={size} variant={chipVariant} tone={chipTone}>
                    {chipTone}
                  </Chip>
                ))}
              </View>
            </Sample>
          )),
        )}
      </Section>

      <Section title={STRINGS.icons.title} description={STRINGS.icons.description}>
        <View className="flex-row flex-wrap gap-2">
          <Chip tone="success" startIcon="check">
            {STRINGS.icons.start}
          </Chip>
          <Chip tone="accent" endIcon={<Icon name="chevron-right" isMirroredInRtl />}>
            {STRINGS.icons.end}
          </Chip>
          <Chip
            tone="success"
            variant="soft"
            startIcon="check"
            endIcon={<Icon name="chevron-right" isMirroredInRtl />}
          >
            {STRINGS.icons.both}
          </Chip>
        </View>
      </Section>

      <Section title={STRINGS.context.title} description={STRINGS.context.description}>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text>{STRINGS.context.sentencePrefix}</Text>
          <Chip size="sm" tone="success" variant="soft">
            {STRINGS.context.sentenceChip}
          </Chip>
          <Text>{STRINGS.context.sentenceSuffix}</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {STRINGS.context.categories.map((category) => (
            <Chip key={category}>{category}</Chip>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="flex-row flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => setVariantIndex((index) => index + 1)}
          >
            {STRINGS.live.nextVariant}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setToneIndex((index) => index + 1)}>
            {STRINGS.live.nextTone}
          </Button>
        </View>
        <View className="items-start" accessibilityLiveRegion="polite">
          <Chip variant={variant} tone={tone}>
            {STRINGS.live.current(variant, tone)}
          </Chip>
        </View>
      </Section>
    </Screen>
  );
}
