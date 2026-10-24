/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native typography (@stackra/ui): each `Text` type in Latin and in
 *          Arabic, each `Heading` type and level, the tones on the page and on a surface, alignment, truncation, text
 *          in its own language, nested inline text, and a live line that steps through the tones.
 * Boundary: presentation and local demo state only; `Text` and `Heading` are @stackra/ui's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { HeadingLevel, HeadingType, TextAlign, TextTone, TextType } from "@stackra/ui/contracts";
import { Button, Heading, Surface, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  latin: "Build once, theme anywhere.",
  arabic: "ابنِ مرة واحدة وطبّق أي سمة.",
  long: "A long sentence shows what alignment and truncation do when it does not fit on one line.",
  textTypes: {
    title: "Text types",
    description:
      'Each `Text` `type`, in Latin and in Arabic (`lang="ar"`, which takes the theme\'s Arabic style).',
  },
  headingTypes: {
    title: "Heading types",
    description: "Every row is a level-3 heading drawn in another `type`, so every style shows.",
  },
  headingLevels: {
    title: "Heading levels",
    description: "`level` alone: each level in the style of its level.",
    level: (level: number) => `Level ${level}`,
  },
  tones: {
    title: "Tones",
    description: "Each `tone` on the page background and on a surface.",
  },
  alignment: {
    title: "Alignment",
    description:
      "`align`: start and end follow the direction, so they swap in Arabic; `justify` is iOS-only.",
  },
  truncation: {
    title: "Truncation",
    description:
      "The same sentence wrapped and cut to one line with `isTruncated`, and a heading cut to one line.",
  },
  language: {
    title: "Language",
    description:
      "Text marked with its own `lang` takes that language's style, whatever the page direction.",
  },
  inline: {
    title: "Inline",
    description: "A Text nested inside a sentence, and small muted text.",
    before: "A sentence with ",
    inline: "inline text",
    after: " nested inside it.",
    small: "Small and muted: the secondary line of a list.",
  },
  live: {
    title: "Try it",
    description: "Press the button to move to the next tone.",
    nextTone: "Next tone",
    state: (tone: string) => `Tone ${tone}.`,
  },
} as const;

/** The typography page: one section per option, in a scrollable screen. */
export function TypographyScreen() {
  const [toneIndex, setToneIndex] = useState(0);
  const tone = TextTone[toneIndex % TextTone.length] ?? "default";

  return (
    <Screen>
      <Section title={STRINGS.textTypes.title} description={STRINGS.textTypes.description}>
        {TextType.map((type) => (
          <Sample key={type} caption={type}>
            <Text type={type}>{STRINGS.latin}</Text>
            <Text type={type} lang="ar">
              {STRINGS.arabic}
            </Text>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.headingTypes.title} description={STRINGS.headingTypes.description}>
        {HeadingType.map((type) => (
          <Sample key={type} caption={type}>
            <Heading level={3} type={type}>
              {STRINGS.latin}
            </Heading>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.headingLevels.title} description={STRINGS.headingLevels.description}>
        {HeadingLevel.map((level) => (
          <Heading key={level} level={level}>
            {STRINGS.headingLevels.level(level)}
          </Heading>
        ))}
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1">
            {TextTone.map((textTone) => (
              <Text key={textTone} tone={textTone}>
                {textTone}
              </Text>
            ))}
          </View>
          <Surface variant="secondary" className="flex-1 gap-1">
            {TextTone.map((textTone) => (
              <Text key={textTone} tone={textTone}>
                {textTone}
              </Text>
            ))}
          </Surface>
        </View>
      </Section>

      <Section title={STRINGS.alignment.title} description={STRINGS.alignment.description}>
        {TextAlign.map((align) => (
          <Sample key={align} caption={align}>
            <Text align={align} className="w-full">
              {STRINGS.long}
            </Text>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.truncation.title} description={STRINGS.truncation.description}>
        <Text>{STRINGS.long}</Text>
        <Text isTruncated>{STRINGS.long}</Text>
        <Heading level={3} isTruncated>
          {STRINGS.long}
        </Heading>
      </Section>

      <Section title={STRINGS.language.title} description={STRINGS.language.description}>
        <Text lang="en">{STRINGS.latin}</Text>
        <Text lang="ar">{STRINGS.arabic}</Text>
        <Heading level={3} lang="ar">
          {STRINGS.arabic}
        </Heading>
      </Section>

      <Section title={STRINGS.inline.title} description={STRINGS.inline.description}>
        <Text>
          {STRINGS.inline.before}
          <Text tone="accent">{STRINGS.inline.inline}</Text>
          {STRINGS.inline.after}
        </Text>
        <Text type="small" tone="muted">
          {STRINGS.inline.small}
        </Text>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Button size="sm" variant="secondary" onPress={() => setToneIndex((index) => index + 1)}>
          {STRINGS.live.nextTone}
        </Button>
        <Text tone={tone} accessibilityLiveRegion="polite">
          {STRINGS.live.state(tone)}
        </Text>
      </Section>
    </Screen>
  );
}
