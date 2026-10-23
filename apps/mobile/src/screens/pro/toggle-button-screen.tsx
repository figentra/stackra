/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ToggleButton` (@stackra/ui-pro): a controlled toggle, both
 *          variants, the three sizes, an icon-only toggle and the disabled state, selected and not.
 * Boundary: presentation and local demo state only; the button is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { ToggleButton } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description:
      "`isSelected` and `onChange` keep the state outside; the selected toggle is tinted.",
    label: "Like",
    on: "Liked",
    status: "State:",
    selected: "selected",
    unselected: "not selected",
  },
  variants: {
    title: "Variants",
    description: "`variant` sets the resting background; both share the selected look.",
    items: [
      { variant: "default", label: "Default" },
      { variant: "ghost", label: "Ghost" },
    ],
  },
  sizes: {
    title: "Sizes",
    description: "`size` is `sm`, `md` or `lg`.",
    items: [
      { size: "sm", label: "Small" },
      { size: "md", label: "Medium" },
      { size: "lg", label: "Large" },
    ],
  },
  iconOnly: {
    title: "Icon only",
    description: "`isIconOnly` makes a square button; `label` is its accessible name.",
    label: "Favourite",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` dims the toggle and blocks presses, selected or not.",
    off: "Disabled",
    on: "Disabled, selected",
  },
} as const;

/** The ToggleButton page: one section per variant and state, in a scrollable screen. */
export function ToggleButtonScreen() {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <View className="flex-row items-center gap-3">
          <ToggleButton label={STRINGS.controlled.label} isSelected={isLiked} onChange={setIsLiked}>
            <ToggleButton.Label>
              {isLiked ? STRINGS.controlled.on : STRINGS.controlled.label}
            </ToggleButton.Label>
          </ToggleButton>
          <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
            {`${STRINGS.controlled.status} ${isLiked ? STRINGS.controlled.selected : STRINGS.controlled.unselected}`}
          </Typography.Paragraph>
        </View>
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <View className="flex-row gap-3">
          {STRINGS.variants.items.map(({ variant, label }) => (
            <ToggleButton key={variant} label={label} variant={variant}>
              {label}
            </ToggleButton>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row items-center gap-3">
          {STRINGS.sizes.items.map(({ size, label }) => (
            <ToggleButton key={size} label={label} size={size} defaultSelected>
              {label}
            </ToggleButton>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.iconOnly.title} description={STRINGS.iconOnly.description}>
        <View className="flex-row gap-3">
          <ToggleButton label={STRINGS.iconOnly.label} isIconOnly>
            <Text className="text-lg text-foreground">★</Text>
          </ToggleButton>
        </View>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <View className="flex-row gap-3">
          <ToggleButton label={STRINGS.disabled.off} isDisabled>
            {STRINGS.disabled.off}
          </ToggleButton>
          <ToggleButton label={STRINGS.disabled.on} isDisabled defaultSelected>
            {STRINGS.disabled.on}
          </ToggleButton>
        </View>
      </Section>
    </Screen>
  );
}
