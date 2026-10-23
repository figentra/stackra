/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Rating` (@stackra/ui-pro): a controlled rating, the three
 *          sizes, read-only fractional values, a ten-star maximum and the disabled state.
 * Boundary: presentation and local demo state only; the rating is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Rating } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description: "Pick a value: `value` and `onValueChange` keep it outside.",
    label: "Rate this product",
    status: "Your rating:",
    of: "of 5",
  },
  sizes: {
    title: "Sizes",
    description: "`size` is `sm`, `md` or `lg`.",
    items: [
      { size: "sm", label: "Small rating, 4 of 5" },
      { size: "md", label: "Medium rating, 4 of 5" },
      { size: "lg", label: "Large rating, 4 of 5" },
    ],
  },
  readOnly: {
    title: "Read only",
    description: "`isReadOnly` blocks input and lets a value fill part of a star.",
    items: [
      { value: 4.5, label: "Average rating, 4.5 of 5" },
      { value: 3.25, label: "Average rating, 3.25 of 5" },
    ],
  },
  max: {
    title: "Maximum",
    description: "`maxValue` sets the number of items; this one has ten.",
    label: "Score out of 10",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` dims the rating and refuses input.",
    label: "Rating, disabled, 3 of 5",
  },
} as const;

/** The Rating page: one section per size and state, in a scrollable screen. */
export function RatingScreen() {
  const [value, setValue] = useState(3);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Rating label={STRINGS.controlled.label} value={value} onValueChange={setValue} />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.status} ${value} ${STRINGS.controlled.of}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="gap-3">
          {STRINGS.sizes.items.map(({ size, label }) => (
            <Rating key={size} label={label} size={size} defaultValue={4} />
          ))}
        </View>
      </Section>

      <Section title={STRINGS.readOnly.title} description={STRINGS.readOnly.description}>
        <View className="gap-3">
          {STRINGS.readOnly.items.map(({ value: amount, label }) => (
            <Rating key={amount} label={label} isReadOnly value={amount} />
          ))}
        </View>
      </Section>

      <Section title={STRINGS.max.title} description={STRINGS.max.description}>
        <Rating label={STRINGS.max.label} maxValue={10} defaultValue={7} size="sm" />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <Rating label={STRINGS.disabled.label} isDisabled value={3} />
      </Section>
    </Screen>
  );
}
