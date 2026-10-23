/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Icon` (@stackra/ui): the sizes, every tone and the colour it
 *          takes from its holder, decorative and labelled icons, the mirror in right-to-left, the Svg pass-through,
 *          and a live icon that steps through sizes and tones.
 * Boundary: presentation and local demo state only; the icon is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Size, TextTone } from "@stackra/ui/contracts";
import { Button, Icon, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: the mobile app registers no icon set yet (it would need @stackra/icons in its dependencies), so the
// page draws the two icons @stackra/ui ships itself; register the Lucide set in the app root, then add names here.
const ICON_NAMES = ["user-round", "external-link"] as const;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  sizes: {
    title: "Sizes",
    description:
      "`sm` 16, `md` 20 and `lg` 24 points. Decorative: no label, so screen readers skip them.",
  },
  tones: {
    title: "Tones",
    description:
      "One icon per `tone`, each labelled with its tone name. With no tone the icon takes the colour of its holder.",
    inherits: "no tone",
  },
  names: {
    title: "Decorative and labelled",
    description:
      "Only the labelled icon is announced; the decorative one sits beside text that already says it.",
    profile: "Profile",
    opensOutside: "Opens outside the app",
  },
  rtl: {
    title: "Right to left",
    description:
      "Switch the language to Arabic: the icon with `isMirroredInRtl` flips because it points the reading way; the other does not.",
    mirrored: "Mirrored in right-to-left",
    neverMirrored: "Never mirrored",
  },
  passthrough: {
    title: "Pass-through",
    description: "Every other Svg prop reaches the icon: a thinner and a thicker stroke here.",
    thin: "strokeWidth 1",
    thick: "strokeWidth 3",
  },
  live: {
    title: "Try it",
    description: "Press the buttons: the icon below changes size or tone.",
    nextSize: "Next size",
    nextTone: "Next tone",
    state: (size: string, tone: string) => `Size ${size}, tone ${tone}.`,
  },
} as const;

/** The Icon page: one section per option, in a scrollable screen. */
export function IconScreen() {
  const [sizeIndex, setSizeIndex] = useState(1);
  const [toneIndex, setToneIndex] = useState(0);
  const size = Size[sizeIndex % Size.length] ?? "md";
  const tone = TextTone[toneIndex % TextTone.length] ?? "default";

  return (
    <Screen>
      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row flex-wrap gap-6">
          {Size.map((iconSize) => (
            <Sample key={iconSize} caption={iconSize}>
              <View className="flex-row gap-2">
                {ICON_NAMES.map((name) => (
                  <Icon key={name} name={name} size={iconSize} />
                ))}
              </View>
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        <View className="flex-row flex-wrap gap-5">
          {TextTone.map((iconTone) => (
            <Sample key={iconTone} caption={iconTone}>
              <Icon name="user-round" size="lg" tone={iconTone} label={iconTone} />
            </Sample>
          ))}
          <Sample caption={STRINGS.tones.inherits}>
            <Icon name="user-round" size="lg" />
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.names.title} description={STRINGS.names.description}>
        <View className="flex-row items-center gap-2">
          <Icon name="user-round" />
          <Text>{STRINGS.names.profile}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Icon name="external-link" tone="accent" label={STRINGS.names.opensOutside} />
        </View>
      </Section>

      <Section title={STRINGS.rtl.title} description={STRINGS.rtl.description}>
        <View className="flex-row flex-wrap gap-8">
          <Sample caption={STRINGS.rtl.mirrored}>
            <Icon name="external-link" size="lg" isMirroredInRtl />
          </Sample>
          <Sample caption={STRINGS.rtl.neverMirrored}>
            <Icon name="external-link" size="lg" />
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.passthrough.title} description={STRINGS.passthrough.description}>
        <View className="flex-row flex-wrap gap-8">
          <Sample caption={STRINGS.passthrough.thin}>
            <Icon name="user-round" size="lg" strokeWidth={1} />
          </Sample>
          <Sample caption={STRINGS.passthrough.thick}>
            <Icon name="user-round" size="lg" strokeWidth={3} />
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="flex-row flex-wrap gap-2">
          <Button size="sm" variant="secondary" onPress={() => setSizeIndex((index) => index + 1)}>
            {STRINGS.live.nextSize}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setToneIndex((index) => index + 1)}>
            {STRINGS.live.nextTone}
          </Button>
        </View>
        <View className="flex-row items-center gap-3">
          <Icon name="user-round" size={size} tone={tone} />
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.live.state(size, tone)}
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
