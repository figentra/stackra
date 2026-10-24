/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Separator` (@stackra/ui): a horizontal rule between two
 *          paragraphs, each level on the surface it matches, a vertical rule between links, and a live rule that
 *          turns between the two orientations.
 * Boundary: presentation and local demo state only; the rule is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { SeparatorVariant, type SurfaceVariant } from "@stackra/ui/contracts";
import { Button, Link, Separator, Surface, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  horizontal: {
    title: "Horizontal",
    description: "Between two paragraphs, the full width of the container.",
    before: "The first paragraph ends here.",
    after: "The second paragraph starts here.",
  },
  levels: {
    title: "Levels",
    description:
      "`variant`: each level on the surface it matches; the rule does not read the level by itself.",
    level: (level: string) => `Level ${level}`,
  },
  vertical: {
    title: "Vertical",
    description:
      '`orientation="vertical"` between links in a row; the rule follows the row\'s height.',
    links: ["Pricing", "Docs", "Support"],
  },
  live: {
    title: "Try it",
    description: "Turn the rule between the two blocks.",
    turn: "Turn the rule",
    orientation: (value: string) => `The rule is ${value}.`,
    blockA: "Block A",
    blockB: "Block B",
  },
} as const;

/** The surface each separator level sits on. */
const SURFACE_OF: Readonly<Record<SeparatorVariant, SurfaceVariant>> = {
  default: "default",
  secondary: "secondary",
  tertiary: "tertiary",
};

/** The Separator page: one section per option, in a scrollable screen. */
export function SeparatorScreen() {
  const [isVertical, setIsVertical] = useState(false);
  const orientation = isVertical ? "vertical" : "horizontal";

  return (
    <Screen>
      <Section title={STRINGS.horizontal.title} description={STRINGS.horizontal.description}>
        <Text>{STRINGS.horizontal.before}</Text>
        <Separator />
        <Text>{STRINGS.horizontal.after}</Text>
      </Section>

      <Section title={STRINGS.levels.title} description={STRINGS.levels.description}>
        {SeparatorVariant.map((variant) => (
          <Surface key={variant} variant={SURFACE_OF[variant]}>
            <View className="gap-3">
              <Text>{STRINGS.levels.level(variant)}</Text>
              <Separator variant={variant} />
              <Text tone="muted">{STRINGS.horizontal.after}</Text>
            </View>
          </Surface>
        ))}
      </Section>

      <Section title={STRINGS.vertical.title} description={STRINGS.vertical.description}>
        <View className="flex-row items-center gap-3 self-start">
          {STRINGS.vertical.links.map((link, index) => (
            <View key={link} className="flex-row items-center gap-3 self-stretch">
              {index > 0 ? <Separator orientation="vertical" /> : null}
              <Link underline="hover" href="https://heroui.com">
                {link}
              </Link>
            </View>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Button size="sm" variant="secondary" onPress={() => setIsVertical((value) => !value)}>
          {STRINGS.live.turn}
        </Button>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.orientation(orientation)}
        </Text>
        <View className={isVertical ? "h-16 flex-row items-stretch gap-3" : "gap-3"}>
          <Text>{STRINGS.live.blockA}</Text>
          <Separator orientation={orientation} />
          <Text>{STRINGS.live.blockB}</Text>
        </View>
      </Section>
    </Screen>
  );
}
