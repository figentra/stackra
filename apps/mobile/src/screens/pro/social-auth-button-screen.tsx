/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SocialAuthButton` (@stackra/ui-pro): all eleven providers
 *          with their default labels, custom labels, a side-by-side pair, the three sizes and the disabled state.
 * Boundary: presentation and local demo state only; the button is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { SocialAuthButton } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  providers: {
    title: "Providers",
    description: "`provider` picks the icon and the default label; each press is recorded below.",
    last: "Last pressed:",
    none: "none yet",
    items: [
      "google",
      "apple",
      "github",
      "facebook",
      "x",
      "microsoft",
      "discord",
      "linkedin",
      "slack",
      "notion",
      "linear",
    ],
  },
  label: {
    title: "Custom label",
    description: "`label` replaces the default text.",
    apple: "Sign in with Apple",
    github: "Log in with GitHub",
  },
  pair: {
    title: "Side by side",
    description: "Two buttons share a row with `flex-1`.",
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
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses the press and dims the button.",
    label: "Continue with Google, unavailable",
  },
} as const;

/** The SocialAuthButton page: one section per layout and state, in a scrollable screen. */
export function SocialAuthButtonScreen() {
  const [lastProvider, setLastProvider] = useState<string>(STRINGS.providers.none);

  return (
    <Screen>
      <Section title={STRINGS.providers.title} description={STRINGS.providers.description}>
        <View className="gap-3">
          {STRINGS.providers.items.map((provider) => (
            <SocialAuthButton
              key={provider}
              provider={provider}
              onPress={() => setLastProvider(provider)}
            />
          ))}
        </View>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.providers.last} ${lastProvider}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.label.title} description={STRINGS.label.description}>
        <View className="gap-3">
          <SocialAuthButton provider="apple" label={STRINGS.label.apple} />
          <SocialAuthButton provider="github" label={STRINGS.label.github} />
        </View>
      </Section>

      <Section title={STRINGS.pair.title} description={STRINGS.pair.description}>
        <View className="flex-row gap-3">
          <SocialAuthButton provider="apple" className="flex-1" />
          <SocialAuthButton provider="google" className="flex-1" />
        </View>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="gap-3">
          {STRINGS.sizes.items.map(({ size, label }) => (
            <SocialAuthButton key={size} provider="google" size={size} label={label} />
          ))}
        </View>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <SocialAuthButton provider="google" label={STRINGS.disabled.label} isDisabled />
      </Section>
    </Screen>
  );
}
