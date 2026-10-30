/**
 * Stackra file contract:
 * Purpose: the "anatomy" demo of the web Card: Header with title and description, content, and a footer with the
 *          actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0060 (light, dark, RTL).
 */
import { Button, Card as UiCard, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_KEYS } from "#src/demos/free/card/card-keys.constant";

/** The demo's keys. */
const K = CARD_KEYS.card;

/** Card: Anatomy. */
export default function Anatomy() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiCard className="max-w-sm">
      <UiCard.Header>
        <UiCard.Title>{t(K.anatomy_title)}</UiCard.Title>
        <UiCard.Description>
          <bdi>{t(K.anatomy_description)}</bdi>
        </UiCard.Description>
      </UiCard.Header>
      <UiCard.Content>
        <bdi>{t(K.anatomy_content)}</bdi>
      </UiCard.Content>
      <UiCard.Footer className="gap-2">
        <Button variant="primary">{t(K.pay)}</Button>
        <Button variant="secondary">{t(K.later)}</Button>
      </UiCard.Footer>
    </UiCard>
  );
}
