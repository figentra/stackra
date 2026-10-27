/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Alert` (@stackra/ui): one alert per tone, with and without a
 *          description, with a custom icon and with none, with actions, and a live alert that can be dismissed and
 *          shown again.
 * Boundary: presentation and local demo state only; the alert is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Enum, Tone } from "@stackra/contracts";
import { Alert, Button, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  tones: {
    title: "Tones",
    description:
      "`tone`: each one has its own icon and colour. Warning and danger are announced at once, the rest politely.",
    alertTitle: (tone: string) => `This is the ${tone} tone`,
    alertDescription: "A line of detail: what happened, or what to do next.",
  },
  plain: {
    title: "Title only",
    description: "The description is optional.",
    alertTitle: "Your changes were saved",
  },
  icons: {
    title: "Icons",
    description: "`icon` replaces the tone's icon with another by name, and `false` draws none.",
    custom: "A bell instead of the tone's icon",
    none: "No icon at all",
  },
  actions: {
    title: "With actions",
    description: "`actions` are the reader's next step, drawn under the description.",
    alertTitle: "Payment failed",
    alertDescription: "Your card was declined. Try another card or contact your bank.",
    retry: "Try another card",
    contact: "Contact support",
  },
  live: {
    title: "Try it",
    description: "Dismiss the alert to hide it; Show again brings it back.",
    alertTitle: "A new version is available",
    alertDescription: "Reload to get the latest changes.",
    dismiss: "Dismiss",
    showAgain: "Show again",
    hidden: "The alert is hidden.",
  },
} as const;

/** The Alert page: one section per option, in a scrollable screen. */
export function AlertScreen() {
  const [isShown, setIsShown] = useState(true);

  return (
    <Screen>
      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {Enum.values(Tone).map((tone) => (
          <Alert
            key={tone}
            tone={tone}
            title={STRINGS.tones.alertTitle(tone)}
            description={STRINGS.tones.alertDescription}
          />
        ))}
      </Section>

      <Section title={STRINGS.plain.title} description={STRINGS.plain.description}>
        <Alert tone="success" title={STRINGS.plain.alertTitle} />
      </Section>

      <Section title={STRINGS.icons.title} description={STRINGS.icons.description}>
        <Alert tone="accent" icon="bell" title={STRINGS.icons.custom} />
        <Alert tone="warning" icon={false} title={STRINGS.icons.none} />
      </Section>

      <Section title={STRINGS.actions.title} description={STRINGS.actions.description}>
        <Alert
          tone="danger"
          title={STRINGS.actions.alertTitle}
          description={STRINGS.actions.alertDescription}
          actions={
            <>
              <Button size="sm">{STRINGS.actions.retry}</Button>
              <Button size="sm" variant="tertiary">
                {STRINGS.actions.contact}
              </Button>
            </>
          }
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        {isShown ? (
          <Alert
            tone="accent"
            title={STRINGS.live.alertTitle}
            description={STRINGS.live.alertDescription}
            actions={
              <Button size="sm" variant="secondary" onPress={() => setIsShown(false)}>
                {STRINGS.live.dismiss}
              </Button>
            }
          />
        ) : (
          <>
            <Text tone="muted" accessibilityLiveRegion="polite">
              {STRINGS.live.hidden}
            </Text>
            <Button size="sm" variant="secondary" onPress={() => setIsShown(true)}>
              {STRINGS.live.showAgain}
            </Button>
          </>
        )}
      </Section>
    </Screen>
  );
}
