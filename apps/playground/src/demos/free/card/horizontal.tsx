/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the web Card: On wide screens the content sits beside a decorative block.
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

/** Card: Horizontal. */
export default function Horizontal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiCard className="max-w-xl md:flex-row md:items-center">
      <div aria-hidden="true" className="h-24 bg-default md:h-24 md:w-40 md:shrink-0" />
      <UiCard.Content>
        <UiCard.Title>{t(K.horizontal_title)}</UiCard.Title>
        <UiCard.Description>
          <bdi>{t(K.horizontal_content)}</bdi>
        </UiCard.Description>
      </UiCard.Content>
    </UiCard>
  );
}
