/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `CloseButton` (@stackra/ui): the default mark, an icon of its
 *          own and the disabled state, and a notice it dismisses.
 * Boundary: presentation and local demo state only; the button is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Button, Card, CloseButton, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  forms: {
    title: "Forms",
    description:
      "The default mark, an `icon` of your own, and `isDisabled`. `label` is required: it is the only name.",
    default: "Close",
    custom: "Dismiss with a custom icon",
    disabled: "Close (disabled)",
  },
  use: {
    title: "In use",
    description: "Dismiss the notice to hide it; Show again brings it back.",
    noticeTitle: "Your changes were saved",
    noticeBody: "You can close this notice at any time.",
    dismiss: "Dismiss notice",
    showAgain: "Show again",
    hidden: "The notice is hidden.",
  },
} as const;

/** The CloseButton page: one section per option, in a scrollable screen. */
export function CloseButtonScreen() {
  const [isShown, setIsShown] = useState(true);

  return (
    <Screen>
      <Section title={STRINGS.forms.title} description={STRINGS.forms.description}>
        <View className="flex-row flex-wrap gap-6">
          <Sample caption="default">
            <CloseButton label={STRINGS.forms.default} />
          </Sample>
          <Sample caption="icon">
            <CloseButton label={STRINGS.forms.custom} icon="user-round" />
          </Sample>
          <Sample caption="isDisabled">
            <CloseButton label={STRINGS.forms.disabled} isDisabled />
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.use.title} description={STRINGS.use.description}>
        {isShown ? (
          <Card>
            <Card.Header className="flex-row items-start justify-between gap-2">
              <Card.Title className="flex-1">{STRINGS.use.noticeTitle}</Card.Title>
              <CloseButton label={STRINGS.use.dismiss} onPress={() => setIsShown(false)} />
            </Card.Header>
            <Card.Content>
              <Text>{STRINGS.use.noticeBody}</Text>
            </Card.Content>
          </Card>
        ) : (
          <View className="items-start gap-2">
            <Text tone="muted" accessibilityLiveRegion="polite">
              {STRINGS.use.hidden}
            </Text>
            <Button size="sm" variant="secondary" onPress={() => setIsShown(true)}>
              {STRINGS.use.showAgain}
            </Button>
          </View>
        )}
      </Section>
    </Screen>
  );
}
