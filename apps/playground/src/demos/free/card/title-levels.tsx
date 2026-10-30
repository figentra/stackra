/**
 * Stackra file contract:
 * Purpose: the "title-levels" demo of the web Card: The title’s level is its place in the outline, level 3 here, and
 *          level 4 for the card inside it. The look stays the card title’s.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0060 (light, dark, RTL).
 */
import { Card as UiCard, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_KEYS } from "#src/demos/free/card/card-keys.constant";

/** The demo's keys. */
const K = CARD_KEYS.card;

/** Card: Title levels. */
export default function TitleLevels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiCard className="max-w-md">
      <UiCard.Header>
        <UiCard.Title level={3}>{t(K.outer_title)}</UiCard.Title>
        <UiCard.Description>
          <bdi>{t(K.outer_description)}</bdi>
        </UiCard.Description>
      </UiCard.Header>
      <UiCard.Content>
        <UiCard variant="transparent" className="border border-border">
          <UiCard.Title level={4}>{t(K.inner_title)}</UiCard.Title>
          <UiCard.Content>
            <bdi>{t(K.inner_content)}</bdi>
          </UiCard.Content>
        </UiCard>
      </UiCard.Content>
    </UiCard>
  );
}
