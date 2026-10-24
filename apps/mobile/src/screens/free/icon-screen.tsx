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

/** The icons each size row draws; every name is registered in the app root. */
const ICON_NAMES = ["search", "heart", "star"] as const;

/** Icons that point the reading way, with what each one means: they flip in right-to-left. */
const MIRRORED = [
  ["Next", "chevron-right"],
  ["Continue", "arrow-right"],
  ["Send", "send-horizontal"],
  ["Undo", "undo-2"],
] as const;

/** Icons that depict an object or a state: they never flip. */
const NEVER_MIRRORED = [
  ["Search", "search"],
  ["Done", "check"],
  ["Play", "play"],
] as const;

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
      "Switch the language to Arabic: the icons that point the reading way flip, the ones that depict an object do not.",
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
              <Icon name="circle-check" size="lg" tone={iconTone} label={iconTone} />
            </Sample>
          ))}
          <Sample caption={STRINGS.tones.inherits}>
            <Icon name="circle-check" size="lg" />
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
        <Text type="small" tone="muted">
          {STRINGS.rtl.mirrored}
        </Text>
        <View className="flex-row flex-wrap gap-6">
          {MIRRORED.map(([label, name]) => (
            <Sample key={name} caption={name}>
              <Icon name={name} size="lg" label={label} isMirroredInRtl />
            </Sample>
          ))}
        </View>
        <Text type="small" tone="muted">
          {STRINGS.rtl.neverMirrored}
        </Text>
        <View className="flex-row flex-wrap gap-6">
          {NEVER_MIRRORED.map(([label, name]) => (
            <Sample key={name} caption={name}>
              <Icon name={name} size="lg" label={label} />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.passthrough.title} description={STRINGS.passthrough.description}>
        <View className="flex-row flex-wrap gap-8">
          <Sample caption={STRINGS.passthrough.thin}>
            <Icon name="search" size="lg" strokeWidth={1} />
          </Sample>
          <Sample caption={STRINGS.passthrough.thick}>
            <Icon name="search" size="lg" strokeWidth={3} />
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
          <Icon name="star" size={size} tone={tone} />
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.live.state(size, tone)}
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
