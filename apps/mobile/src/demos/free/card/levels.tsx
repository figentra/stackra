/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the native Card: one card per surface `variant`; transparent drops background and shadow.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Card, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_DEMO_KEYS } from "#src/demos/free/card/card-demo-keys.constant";

/** The demo's keys. */
const K = CARD_DEMO_KEYS.demo_free.card.levels;

/** One card per level. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {SurfaceVariant.map((variant) => (
        <Card key={variant} variant={variant}>
          <Card.Header>
            <Card.Title>{t(K.card_title, { level: variant })}</Card.Title>
            <Card.Description>{t(K.card_description)}</Card.Description>
          </Card.Header>
          <Card.Content>
            <Text>{t(K.content)}</Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}
