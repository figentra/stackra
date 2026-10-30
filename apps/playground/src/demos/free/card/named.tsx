/**
 * Stackra file contract:
 * Purpose: the "named" demo of the web Card: The card is an article, named by its title through aria-labelledby.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0060 (light, dark, RTL).
 */
import { Card as UiCard, useCatalogueText } from "@stackra/ui/react";
import { useId } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_KEYS } from "#src/demos/free/card/card-keys.constant";

/** The demo's keys. */
const K = CARD_KEYS.card;

/** Card: Named card. */
export default function Named() {
  const t = useCatalogueText(MESSAGES.en);
  // useId, not a literal: the page draws a demo more than once (its section, the hero, the RTL panel).
  const id = useId();
  return (
    <UiCard role="article" aria-labelledby={id} className="max-w-sm">
      <UiCard.Header>
        <UiCard.Title id={id}>{t(K.named_title)}</UiCard.Title>
      </UiCard.Header>
      <UiCard.Content>
        <bdi>{t(K.named_content)}</bdi>
      </UiCard.Content>
    </UiCard>
  );
}
