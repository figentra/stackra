/**
 * Stackra file contract:
 * Purpose: the "anatomy" demo of the native Card: header with title and description, content, and a footer of actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Card, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_DEMO_KEYS } from "#src/demos/free/card/card-demo-keys.constant";

/** The demo's keys. */
const K = CARD_DEMO_KEYS.demo_free.card.anatomy;

/** Every part of a card. */
export default function Anatomy() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t(K.card_title)}</Card.Title>
        <Card.Description>{t(K.card_description)}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Text>{t(K.content)}</Text>
      </Card.Content>
      <Card.Footer className="flex-row flex-wrap gap-2">
        <Button size="sm">{t(K.pay)}</Button>
        <Button size="sm" variant="tertiary">
          {t(K.later)}
        </Button>
      </Card.Footer>
    </Card>
  );
}
