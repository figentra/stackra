/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ModeSwitch` (@stackra/ui): the developer display mode turned
 *          on and off, with the mode it reports read out under it, and a disabled switch.
 * Boundary: presentation and local demo state only; the switch is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-803.
 */
import { ModeSwitch, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  live: { title: "Try it", description: "`onModeChange` reports `normal` or `developer`." },
  label: "Developer mode",
  help: "Show ids, keys and raw values.",
  current: (mode: string) => `Current mode: ${mode}`,
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses switching.",
    label: "Developer mode (locked)",
  },
} as const;

/** The ModeSwitch page. */
export function ModeSwitchScreen() {
  const [mode, setMode] = useState<"normal" | "developer">("normal");
  return (
    <Screen>
      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="gap-2">
          <ModeSwitch
            label={STRINGS.label}
            description={STRINGS.help}
            mode={mode}
            onModeChange={setMode}
          />
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.current(mode)}
          </Text>
        </View>
      </Section>
      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <ModeSwitch label={STRINGS.disabled.label} isDisabled />
      </Section>
    </Screen>
  );
}
