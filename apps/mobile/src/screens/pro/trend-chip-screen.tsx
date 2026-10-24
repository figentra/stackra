/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `TrendChip` (@stackra/ui-pro): the three trend directions,
 *          the four variants, the three sizes and a chip with a prefix and a suffix around the value.
 * Boundary: presentation only; the chip is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { TrendChip } from "@stackra/ui-pro/native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  trends: {
    title: "Trend direction",
    description:
      "`trend` sets the arrow and the colour: up is success, neutral is warning, down is danger.",
    items: [
      { trend: "up", value: "+12.4%" },
      { trend: "neutral", value: "0.0%" },
      { trend: "down", value: "-3.2%" },
    ],
  },
  variants: {
    title: "Variants",
    description: "`variant`: `primary`, `secondary`, `tertiary` and `soft`.",
    items: ["primary", "secondary", "tertiary", "soft"],
  },
  sizes: {
    title: "Sizes",
    description: "`size`: `sm`, `md` and `lg`.",
    items: ["sm", "md", "lg"],
  },
  affixes: {
    title: "Prefix and suffix",
    description: "Compose the chip with `Indicator`, `Prefix`, `Value` and `Suffix`.",
    gain: "$1,248",
    drop: "-5.9",
    suffix: "vs last month",
  },
} as const;

/** The TrendChip page: one section per option, in a scrollable screen. */
export function TrendChipScreen() {
  return (
    <Screen>
      <Section title={STRINGS.trends.title} description={STRINGS.trends.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          {STRINGS.trends.items.map(({ trend, value }) => (
            <TrendChip key={trend} trend={trend}>
              {value}
            </TrendChip>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          {STRINGS.variants.items.map((variant) => (
            <TrendChip key={variant} variant={variant} trend="up">
              +12.4%
            </TrendChip>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          {STRINGS.sizes.items.map((size) => (
            <TrendChip key={size} size={size} trend="up">
              +4.1%
            </TrendChip>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.affixes.title} description={STRINGS.affixes.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          <TrendChip trend="up">
            <TrendChip.Indicator />
            <TrendChip.Prefix>+</TrendChip.Prefix>
            <TrendChip.Value>{STRINGS.affixes.gain}</TrendChip.Value>
          </TrendChip>
          <TrendChip trend="down">
            <TrendChip.Indicator />
            <TrendChip.Value>{STRINGS.affixes.drop}</TrendChip.Value>
            <TrendChip.Suffix>{STRINGS.affixes.suffix}</TrendChip.Suffix>
          </TrendChip>
        </View>
      </Section>
    </Screen>
  );
}
