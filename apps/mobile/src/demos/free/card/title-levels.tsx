/**
 * Stackra file contract:
 * Purpose: the "title-levels" demo of the native Card: `Card.Title` `level` is its outline place; the look stays.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Card, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_DEMO_KEYS } from "#src/demos/free/card/card-demo-keys.constant";

/** The demo's keys. */
const K = CARD_DEMO_KEYS.demo_free.card.title_levels;

/** Level 3 outside, level 4 for the card inside. */
export default function TitleLevels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card>
      <Card.Header>
        <Card.Title level={3}>{t(K.outer_title)}</Card.Title>
        <Card.Description>{t(K.outer_description)}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Card variant="secondary">
          <Card.Header>
            <Card.Title level={4}>{t(K.inner_title)}</Card.Title>
          </Card.Header>
          <Card.Content>
            <Text>{t(K.inner_content)}</Text>
          </Card.Content>
        </Card>
      </Card.Content>
    </Card>
  );
}
