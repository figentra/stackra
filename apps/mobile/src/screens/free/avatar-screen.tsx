/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Avatar` (@stackra/ui): each size and shape with an image and
 *          with initials, each tone and variant, the fallbacks, Latin and Arabic names, the accessible name, and a
 *          live sample that steps through names and turns the image on and off.
 * Boundary: presentation and local demo state only; the avatar is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { AvatarShape, AvatarVariant, Size, Tone } from "@stackra/ui/contracts";
import { Avatar, Button, Icon, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  sizes: {
    title: "Sizes and shapes",
    description: "A row per shape: each size with an image, then with initials.",
    shape: (shape: string) => `Shape ${shape}`,
  },
  tones: {
    title: "Tones and variants",
    description: "A row per variant: the initials of each tone.",
    variant: (variant: string) => `Variant ${variant}`,
  },
  fallbacks: {
    title: "Fallbacks",
    description:
      "An image, a broken image that falls back to initials, an icon for an organisation, and no name at all.",
    loaded: "Loaded image",
    broken: "Broken image",
    organisation: "Organisation",
    anonymous: "No name",
  },
  names: {
    title: "Names",
    description:
      "Initials are the first letters of the first and last words; an Arabic name gives one letter.",
  },
  accessible: {
    title: "Accessible name",
    description:
      "A standalone avatar carries a `label`. In a list row the visible name is enough, so the avatar is decorative.",
    standalone: "Ada Lovelace",
    rowName: "Ada Lovelace",
    rowRole: "Administrator",
  },
  live: {
    title: "Try it",
    description: "Step through the names and turn the image on or off.",
    nextName: "Next name",
    imageOn: "Show image",
    imageOff: "Hide image",
    current: "Current avatar",
  },
  person: "Ada Lovelace",
  company: "Figentra",
} as const;

/** A one-pixel slate PNG, so the image samples never touch the network; React Native's Image draws no SVG. */
const SAMPLE_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** A URL that is not an image, so the avatar falls back to its initials. */
const BROKEN_IMAGE = "https://invalid.example/missing-avatar.png";

/** The names of the name sample, each beside its initials, and the live sample's cycle. */
const NAMES = ["Ada Lovelace", "Plato", "émile zola", "ليلى أحمد"] as const;

/** The Avatar page: one section per option, in a scrollable screen. */
export function AvatarScreen() {
  const [nameIndex, setNameIndex] = useState(0);
  const [hasImage, setHasImage] = useState(false);
  const current = NAMES[nameIndex % NAMES.length] ?? NAMES[0];

  return (
    <Screen>
      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {AvatarShape.map((shape) => (
          <View key={shape} className="gap-2">
            <Text type="small" tone="muted">
              {STRINGS.sizes.shape(shape)}
            </Text>
            <View className="flex-row flex-wrap items-center gap-3">
              {Size.map((size) => (
                <Avatar
                  key={`image-${size}`}
                  size={size}
                  shape={shape}
                  src={SAMPLE_IMAGE}
                  name={STRINGS.person}
                />
              ))}
              {Size.map((size) => (
                <Avatar key={`initials-${size}`} size={size} shape={shape} name={STRINGS.person} />
              ))}
            </View>
          </View>
        ))}
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {AvatarVariant.map((variant) => (
          <View key={variant} className="gap-2">
            <Text type="small" tone="muted">
              {STRINGS.tones.variant(variant)}
            </Text>
            <View className="flex-row flex-wrap items-center gap-3">
              {Tone.map((tone) => (
                <Sample key={tone} caption={tone}>
                  <Avatar tone={tone} variant={variant} name={STRINGS.person} />
                </Sample>
              ))}
            </View>
          </View>
        ))}
      </Section>

      <Section title={STRINGS.fallbacks.title} description={STRINGS.fallbacks.description}>
        <View className="flex-row flex-wrap items-start gap-4">
          <Sample caption={STRINGS.fallbacks.loaded}>
            <Avatar src={SAMPLE_IMAGE} name={STRINGS.person} />
          </Sample>
          <Sample caption={STRINGS.fallbacks.broken}>
            <Avatar src={BROKEN_IMAGE} name={STRINGS.person} />
          </Sample>
          <Sample caption={STRINGS.fallbacks.organisation}>
            <Avatar
              shape="square"
              tone="accent"
              variant="soft"
              name={STRINGS.company}
              fallback={<Icon name="user-round" />}
            />
          </Sample>
          <Sample caption={STRINGS.fallbacks.anonymous}>
            <Avatar />
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.names.title} description={STRINGS.names.description}>
        <View className="flex-row flex-wrap items-start gap-4">
          {NAMES.map((name) => (
            <Sample key={name} caption={name}>
              <Avatar name={name} tone="accent" variant="soft" />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.accessible.title} description={STRINGS.accessible.description}>
        <View className="flex-row items-center gap-4">
          <Avatar
            name={STRINGS.accessible.standalone}
            label={STRINGS.accessible.standalone}
            size="lg"
          />
          <View className="flex-row items-center gap-3">
            <Avatar name={STRINGS.accessible.rowName} />
            <View>
              <Text>{STRINGS.accessible.rowName}</Text>
              <Text type="small" tone="muted">
                {STRINGS.accessible.rowRole}
              </Text>
            </View>
          </View>
        </View>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="flex-row flex-wrap gap-2">
          <Button size="sm" variant="secondary" onPress={() => setNameIndex((index) => index + 1)}>
            {STRINGS.live.nextName}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setHasImage((value) => !value)}>
            {hasImage ? STRINGS.live.imageOff : STRINGS.live.imageOn}
          </Button>
        </View>
        <View className="flex-row items-center gap-3">
          <Avatar
            size="lg"
            name={current}
            label={STRINGS.live.current}
            {...(hasImage ? { src: SAMPLE_IMAGE } : {})}
          />
          <Text accessibilityLiveRegion="polite">{current}</Text>
        </View>
      </Section>
    </Screen>
  );
}
