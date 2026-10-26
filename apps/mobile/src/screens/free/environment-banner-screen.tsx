/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `EnvironmentBanner` (@stackra/ui): a sandbox named with what
 *          it means and a publish action, and a switch that turns the demo into production, where it draws nothing.
 * Boundary: presentation and local demo state only; the banner is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-803.
 */
import { Button, EnvironmentBanner, Switch } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  title: "Sandbox",
  description: "`isProduction` hides the banner; switch it to see production.",
  environment: "Sandbox",
  meaning: "Payments are test payments and messages are captured, not sent.",
  publish: "Publish to live",
  production: "Show as production",
} as const;

/** The EnvironmentBanner page. */
export function EnvironmentBannerScreen() {
  const [isProduction, setIsProduction] = useState(false);
  return (
    <Screen>
      <Section title={STRINGS.title} description={STRINGS.description}>
        <View className="gap-3">
          <Switch label={STRINGS.production} value={isProduction} onChange={setIsProduction} />
          <EnvironmentBanner
            environment={STRINGS.environment}
            isProduction={isProduction}
            description={STRINGS.meaning}
            actions={<Button size="sm">{STRINGS.publish}</Button>}
          />
        </View>
      </Section>
    </Screen>
  );
}
