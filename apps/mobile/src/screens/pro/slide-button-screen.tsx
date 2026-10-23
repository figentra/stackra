/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SlideButton` (@stackra/ui-pro): a controlled
 *          slide-to-confirm with its status, one slider for each `tone`, and the disabled state.
 * Boundary: presentation and local demo state only; the slider is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0304 (decision 6); STA-403 FR-009.
 */
import { SlideButton } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";

import { Screen } from "../../components/ui/screen";
import { Section } from "../../components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  transfer: {
    title: "Slide to confirm",
    description: "Drag the handle past the end to confirm; letting go early snaps it back.",
    name: "Confirm the transfer",
    prompt: "Slide to send 250.00",
    done: "Sent",
    idleStatus: "Idle: nothing sent yet.",
    doneStatus: "Done: the transfer was sent.",
  },
  tones: {
    title: "Tones",
    description:
      "The colour role of the track and the fill; each slider resets itself after it completes.",
    items: [
      { tone: "default", prompt: "Slide to continue", done: "Continued" },
      { tone: "accent", prompt: "Slide to unlock", done: "Unlocked" },
      { tone: "success", prompt: "Slide to approve", done: "Approved" },
      { tone: "danger", prompt: "Slide to delete", done: "Deleted" },
    ],
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses the slide gesture and shows the disabled style.",
    label: "Slide is unavailable",
  },
} as const;

/** The SlideButton page: one section per state, in a scrollable screen. */
export function SlideButtonScreen() {
  const [isSent, setIsSent] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.transfer.title} description={STRINGS.transfer.description}>
        <SlideButton
          label={STRINGS.transfer.name}
          tone="success"
          autoReset
          autoResetDelay={2500}
          onCompleteChange={setIsSent}
        >
          <SlideButton.UnderlayContent>
            <SlideButton.Label>{STRINGS.transfer.prompt}</SlideButton.Label>
          </SlideButton.UnderlayContent>
          <SlideButton.OverlayContent>
            <SlideButton.Label>{STRINGS.transfer.done}</SlideButton.Label>
          </SlideButton.OverlayContent>
          <SlideButton.Thumb />
        </SlideButton>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {isSent ? STRINGS.transfer.doneStatus : STRINGS.transfer.idleStatus}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {STRINGS.tones.items.map(({ tone, prompt, done }) => (
          <SlideButton key={tone} label={prompt} tone={tone} autoReset>
            <SlideButton.UnderlayContent>
              <SlideButton.Label>{prompt}</SlideButton.Label>
            </SlideButton.UnderlayContent>
            <SlideButton.OverlayContent>
              <SlideButton.Label>{done}</SlideButton.Label>
            </SlideButton.OverlayContent>
            <SlideButton.Thumb />
          </SlideButton>
        ))}
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <SlideButton label={STRINGS.disabled.label} isDisabled>
          <SlideButton.UnderlayContent>
            <SlideButton.Label>{STRINGS.disabled.label}</SlideButton.Label>
          </SlideButton.UnderlayContent>
          <SlideButton.OverlayContent />
          <SlideButton.Thumb />
        </SlideButton>
      </Section>
    </Screen>
  );
}
