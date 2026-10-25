/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Badge` (@stackra-pro/ui): a count and a dot over an anchor,
 *          each `tone`, the three variants and sizes, and the four corner placements.
 * Boundary: presentation only; the badge is @stackra-pro/ui's, the anchored boxes use theme classes.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { Badge } from "@stackra-pro/ui/native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  anchored: {
    title: "Count and dot",
    description:
      "Inside `Badge.Anchor` a badge sits on the corner of what it marks; without children it is a dot.",
    count: "Inbox, 5 unread",
    dot: "Status, online",
    countText: "5",
    inbox: "Inbox",
    status: "Status",
  },
  tones: {
    title: "Tones",
    description: "`tone` picks the colour role.",
    items: ["default", "accent", "success", "warning", "danger"],
  },
  variants: {
    title: "Variants",
    description: "`variant`: `primary`, `secondary` and `soft`.",
    items: ["primary", "secondary", "soft"],
  },
  sizes: {
    title: "Sizes",
    description: "`size`: `sm`, `md` and `lg`.",
    items: ["sm", "md", "lg"],
  },
  placements: {
    title: "Placements",
    description: "`placement` moves the badge to another corner of its anchor.",
    items: [
      { placement: "top-right", label: "Top right" },
      { placement: "top-left", label: "Top left" },
      { placement: "bottom-right", label: "Bottom right" },
      { placement: "bottom-left", label: "Bottom left" },
    ],
  },
} as const;

/** The box a badge is anchored to: a surface tile with a caption. */
function Tile({ caption }: { caption: string }) {
  return (
    <View className="size-14 items-center justify-center rounded-xl bg-surface-secondary">
      <Text type="caption" tone="muted">
        {caption}
      </Text>
    </View>
  );
}

/** The Badge page: one section per option, in a scrollable screen. */
export function BadgeScreen() {
  return (
    <Screen>
      <Section title={STRINGS.anchored.title} description={STRINGS.anchored.description}>
        <View className="flex-row gap-6">
          <Badge.Anchor accessible accessibilityLabel={STRINGS.anchored.count}>
            <Tile caption={STRINGS.anchored.inbox} />
            <Badge tone="danger" size="sm">
              {STRINGS.anchored.countText}
            </Badge>
          </Badge.Anchor>
          <Badge.Anchor accessible accessibilityLabel={STRINGS.anchored.dot}>
            <Tile caption={STRINGS.anchored.status} />
            <Badge tone="success" />
          </Badge.Anchor>
        </View>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          {STRINGS.tones.items.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          {STRINGS.variants.items.map((variant) => (
            <Badge key={variant} tone="accent" variant={variant}>
              {variant}
            </Badge>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          {STRINGS.sizes.items.map((size) => (
            <Badge key={size} size={size}>
              {size}
            </Badge>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.placements.title} description={STRINGS.placements.description}>
        <View className="flex-row flex-wrap gap-6">
          {STRINGS.placements.items.map(({ placement, label }) => (
            <Badge.Anchor key={placement} accessible accessibilityLabel={label}>
              <Tile caption={label} />
              <Badge tone="accent" size="sm" placement={placement} />
            </Badge.Anchor>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
