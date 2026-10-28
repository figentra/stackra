/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Badge` (@stackra/ui): each variant and tone, the sizes, the
 *          four logical corners, presence dots, a number, a word and an icon as content, and a badge on a control.
 * Boundary: presentation and local demo state only; the badge is @stackra/ui's, its anchors are @stackra/ui avatars.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Enum, Tone } from "@stackra/contracts";
import { BadgePlacement, BadgeVariant, Size } from "@stackra/ui/contracts";
import { Avatar, Badge, Button, Icon, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants and tones",
    description: "A row per variant, an anchor per tone, each badge labelled for a screen reader.",
    label: (tone: string, variant: string) => `${tone} ${variant}: 5 new`,
  },
  sizes: {
    title: "Sizes",
    description: "Small, medium and large, with a one-digit count and a capped one.",
    label: (size: string, count: string) => `${size}: ${count} new`,
  },
  corners: {
    title: "Corners",
    description:
      "The four logical corners, each with a labelled dot: `top-end` is top right in English, top left in Arabic.",
    label: (placement: string) => `Dot at ${placement}`,
  },
  dots: {
    title: "Dots",
    description: "Presence dots at the bottom end, small.",
    online: "Online",
    away: "Away",
    busy: "Busy",
  },
  content: {
    title: "Content",
    description: "A number, a word and an icon.",
    number: "8 new",
    word: "New item",
    wordText: "New",
    iconLabel: "Alerts",
  },
  control: {
    title: "On a control",
    description:
      "The badge is not labelled: the button's own name already says the count, and a press on the badge reaches the button.",
    button: "Notifications",
    label: (count: number) => `Notifications, ${count} unread`,
    presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  },
  person: "Ada Lovelace",
} as const;

/** The anchor every badge on this page is pinned to: a decorative avatar. */
function Anchor() {
  return <Avatar name={STRINGS.person} shape="square" />;
}

/** The Badge page: one section per option, in a scrollable screen. */
export function BadgeScreen() {
  const [presses, setPresses] = useState(0);
  const unread = 3 + presses;

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        {BadgeVariant.map((variant) => (
          <Sample key={variant} caption={variant}>
            <View className="flex-row flex-wrap gap-5 pt-2">
              {Enum.values(Tone).map((tone) => (
                <Badge.Anchor key={tone}>
                  <Anchor />
                  <Badge
                    tone={tone}
                    variant={variant}
                    label={STRINGS.variants.label(tone, variant)}
                  >
                    {5}
                  </Badge>
                </Badge.Anchor>
              ))}
            </View>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row flex-wrap gap-6 pt-2">
          {Size.map((size) =>
            ["3", "99+"].map((count) => (
              <Sample key={`${size}-${count}`} caption={size}>
                <Badge.Anchor>
                  <Anchor />
                  <Badge tone="danger" size={size} label={STRINGS.sizes.label(size, count)}>
                    {count}
                  </Badge>
                </Badge.Anchor>
              </Sample>
            )),
          )}
        </View>
      </Section>

      <Section title={STRINGS.corners.title} description={STRINGS.corners.description}>
        <View className="flex-row flex-wrap gap-6 pt-2">
          {BadgePlacement.map((placement) => (
            <Sample key={placement} caption={placement}>
              <Badge.Anchor>
                <Anchor />
                <Badge
                  tone="accent"
                  size="sm"
                  placement={placement}
                  label={STRINGS.corners.label(placement)}
                />
              </Badge.Anchor>
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.dots.title} description={STRINGS.dots.description}>
        <View className="flex-row flex-wrap gap-6">
          {(
            [
              ["success", STRINGS.dots.online],
              ["warning", STRINGS.dots.away],
              ["danger", STRINGS.dots.busy],
            ] as const
          ).map(([tone, label]) => (
            <Sample key={tone} caption={label}>
              <Badge.Anchor>
                <Avatar name={STRINGS.person} />
                <Badge tone={tone} size="sm" placement="bottom-end" label={label} />
              </Badge.Anchor>
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.content.title} description={STRINGS.content.description}>
        <View className="flex-row flex-wrap gap-6 pt-2">
          <Badge.Anchor>
            <Anchor />
            <Badge tone="accent" label={STRINGS.content.number}>
              {8}
            </Badge>
          </Badge.Anchor>
          <Badge.Anchor>
            <Anchor />
            <Badge tone="success" variant="soft" label={STRINGS.content.word}>
              {STRINGS.content.wordText}
            </Badge>
          </Badge.Anchor>
          <Badge.Anchor>
            <Anchor />
            <Badge tone="warning" label={STRINGS.content.iconLabel}>
              <Icon name="bell" size="sm" />
            </Badge>
          </Badge.Anchor>
        </View>
      </Section>

      <Section title={STRINGS.control.title} description={STRINGS.control.description}>
        <View className="flex-row items-center gap-4 pt-2">
          <Badge.Anchor>
            <Button
              variant="secondary"
              label={STRINGS.control.label(unread)}
              onPress={() => setPresses((count) => count + 1)}
            >
              {STRINGS.control.button}
            </Button>
            <Badge tone="danger" size="sm">
              {unread}
            </Badge>
          </Badge.Anchor>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.control.presses(presses)}
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
