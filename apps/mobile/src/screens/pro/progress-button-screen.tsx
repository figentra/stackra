/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ProgressButton` (@stackra/ui-pro): a controlled
 *          press-and-hold confirmation that goes idle, filling, done, then each `tone`, two hold durations and the
 *          disabled state.
 * Boundary: presentation and local demo state only; the button is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-403 FR-008.
 */
import { ProgressButton } from "@stackra/ui-pro/native";
import { Button, Typography } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  confirm: {
    title: "Hold to confirm",
    description:
      "Press and hold: the overlay fills while the button is held and the action completes at the end.",
    name: "Confirm order",
    idle: "Hold to confirm",
    done: "Confirmed",
    idleStatus: "Idle: nothing confirmed yet.",
    doneStatus: "Done: the order is confirmed.",
    reset: "Reset",
  },
  tones: {
    title: "Tones",
    description: "The colour role of the fill; each button resets itself after it completes.",
    items: [
      { tone: "default", label: "Hold to continue" },
      { tone: "accent", label: "Hold to unlock" },
      { tone: "success", label: "Hold to approve" },
      { tone: "danger", label: "Hold to delete" },
    ],
  },
  durations: {
    title: "Hold durations",
    description: "`holdDuration` sets how long the press must last, in milliseconds.",
    items: [
      { duration: 800, label: "Quick hold: 0.8 s" },
      { duration: 3000, label: "Long hold: 3 s" },
    ],
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses the hold and shows the disabled style.",
    label: "Hold is unavailable",
  },
} as const;

/** The ProgressButton page: one section per state, in a scrollable screen. */
export function ProgressButtonScreen() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const confirmLabel = isConfirmed ? STRINGS.confirm.done : STRINGS.confirm.idle;

  return (
    <Screen>
      <Section title={STRINGS.confirm.title} description={STRINGS.confirm.description}>
        <ProgressButton
          label={STRINGS.confirm.name}
          tone="accent"
          holdDuration={1500}
          isCompleted={isConfirmed}
          onCompleteChange={setIsConfirmed}
        >
          <ProgressButton.Label>{confirmLabel}</ProgressButton.Label>
          <ProgressButton.Overlay>
            <ProgressButton.MaskLabel>{confirmLabel}</ProgressButton.MaskLabel>
          </ProgressButton.Overlay>
        </ProgressButton>
        <View className="flex-row items-center justify-between gap-3">
          <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
            {isConfirmed ? STRINGS.confirm.doneStatus : STRINGS.confirm.idleStatus}
          </Typography.Paragraph>
          {isConfirmed ? (
            <Button size="sm" variant="secondary" onPress={() => setIsConfirmed(false)}>
              {STRINGS.confirm.reset}
            </Button>
          ) : null}
        </View>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {STRINGS.tones.items.map(({ tone, label }) => (
          <ProgressButton key={tone} label={label} tone={tone} autoReset>
            {label}
          </ProgressButton>
        ))}
      </Section>

      <Section title={STRINGS.durations.title} description={STRINGS.durations.description}>
        {STRINGS.durations.items.map(({ duration, label }) => (
          <ProgressButton key={duration} label={label} holdDuration={duration} autoReset>
            {label}
          </ProgressButton>
        ))}
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <ProgressButton label={STRINGS.disabled.label} isDisabled>
          {STRINGS.disabled.label}
        </ProgressButton>
      </Section>
    </Screen>
  );
}
