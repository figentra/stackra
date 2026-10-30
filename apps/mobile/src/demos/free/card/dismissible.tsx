/**
 * Stackra file contract:
 * Purpose: the "dismissible" demo of the native Card: a CloseButton hides it; Show again brings it back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Card, CloseButton, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_DEMO_KEYS } from "#src/demos/free/card/card-demo-keys.constant";

/** The demo's keys. */
const K = CARD_DEMO_KEYS.demo_free.card.dismissible;

/** A card with a close button in its header. */
export default function Dismissible() {
  const [isShown, setIsShown] = useState(true);
  const t = useCatalogueText(MESSAGES.en);
  return isShown ? (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-2">
        <Card.Title className="flex-1">{t(K.card_title)}</Card.Title>
        <CloseButton label={t(K.dismiss)} onPress={() => setIsShown(false)} />
      </Card.Header>
      <Card.Content>
        <Text>{t(K.content)}</Text>
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
