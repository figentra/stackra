/**
 * Stackra file contract:
 * Purpose: the "use" demo of the native CloseButton: it dismisses a notice; Show again brings it back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Card, CloseButton, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CLOSE_BUTTON_DEMO_KEYS } from "#src/demos/free/close-button/close-button-demo-keys.constant";

/** The demo's keys. */
const K = CLOSE_BUTTON_DEMO_KEYS.demo_free.close_button.use;

/** A notice with a close button. */
export default function Use() {
  const [isShown, setIsShown] = useState(true);
  const t = useCatalogueText(MESSAGES.en);
  return isShown ? (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-2">
        <Card.Title className="flex-1">{t(K.notice_title)}</Card.Title>
        <CloseButton label={t(K.dismiss)} onPress={() => setIsShown(false)} />
      </Card.Header>
      <Card.Content>
        <Text>{t(K.notice_body)}</Text>
      </Card.Content>
    </Card>
  ) : (
    <View className="items-start gap-2">
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.hidden)}
      </Text>
      <Button size="sm" variant="secondary" onPress={() => setIsShown(true)}>
        {t(K.show_again)}
      </Button>
    </View>
  );
}
