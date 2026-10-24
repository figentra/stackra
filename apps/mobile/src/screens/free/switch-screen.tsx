/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Switch` (@stackra/ui): one switch per state (off, on,
 *          disabled, read-only, required, described, invalid), one without a visible label, and three live settings
 *          with a readout of the ones that are on.
 * Boundary: presentation and local demo state only; the switch is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Switch, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  states: {
    title: "States",
    description: "One switch per state; each label says what it shows.",
    off: "Airplane mode",
    on: "Wi-Fi",
    disabled: "Bluetooth (disabled)",
    disabledOn: "Location services (disabled, on)",
    readOnly: "Cloud backup (read-only)",
    required: "Allow the app to run in the background",
    described: "Notifications",
    descriptionText: "Get an alert when an order ships.",
    invalid: "Share my profile",
    errorText: "Turn this on to continue.",
  },
  unnamed: {
    title: "Without a visible label",
    description: "A switch with no label takes an accessible name instead, as an icon toggle does.",
    name: "Mute all sounds",
  },
  live: {
    title: "Try it",
    description: "Three settings; the readout lists the ones that are on.",
    summary: (names: string) => `On: ${names}`,
    none: "nothing",
  },
} as const;

/** The settings of the live sample. */
const SETTINGS = ["Dark keyboard", "Sounds", "Vibration"] as const;

/** The Switch page: one section per option, in a scrollable screen. */
export function SwitchScreen() {
  const [on, setOn] = useState<readonly string[]>(["Sounds"]);

  return (
    <Screen>
      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Switch label={STRINGS.states.off} />
        <Switch label={STRINGS.states.on} defaultValue />
        <Switch label={STRINGS.states.disabled} isDisabled />
        <Switch label={STRINGS.states.disabledOn} isDisabled defaultValue />
        <Switch label={STRINGS.states.readOnly} isReadOnly defaultValue />
        <Switch label={STRINGS.states.required} isRequired />
        <Switch label={STRINGS.states.described} description={STRINGS.states.descriptionText} />
        <Switch label={STRINGS.states.invalid} isInvalid errorMessage={STRINGS.states.errorText} />
      </Section>

      <Section title={STRINGS.unnamed.title} description={STRINGS.unnamed.description}>
        <Switch accessibilityLabel={STRINGS.unnamed.name} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        {SETTINGS.map((name) => (
          <Switch
            key={name}
            label={name}
            value={on.includes(name)}
            onChange={(isOn) =>
              setOn((list) => (isOn ? [...list, name] : list.filter((item) => item !== name)))
            }
          />
        ))}
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.summary(on.length === 0 ? STRINGS.live.none : on.join(", "))}
        </Text>
      </Section>
    </Screen>
  );
}
