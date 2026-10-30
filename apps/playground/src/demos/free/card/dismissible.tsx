/**
 * Stackra file contract:
 * Purpose: the "dismissible" demo of the web Card: Dismiss the card to hide it; Show again brings it back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0060 (light, dark, RTL).
 */
import { Button, Card as UiCard, CloseButton, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_KEYS } from "#src/demos/free/card/card-keys.constant";

/** The demo's keys. */
const K = CARD_KEYS.card;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Card: Dismissible. */
export default function Dismissible() {
  const t = useCatalogueText(MESSAGES.en);
  const [isShown, setIsShown] = useState(true);

  return (
    <div className="grid max-w-sm gap-3">
      {isShown ? (
        <UiCard>
          <CloseButton
            label={t(K.dismiss)}
            className="absolute end-3 top-3"
            onPress={() => setIsShown(false)}
          />
          <UiCard.Header>
            <UiCard.Title>{t(K.dismissible_title)}</UiCard.Title>
          </UiCard.Header>
          <UiCard.Content>
            <bdi>{t(K.dismissible_content)}</bdi>
          </UiCard.Content>
        </UiCard>
      ) : (
        <div className={ROW}>
          <Text role="status" tone="muted">
            <bdi>{t(K.hidden)}</bdi>
          </Text>
          <Button variant="secondary" onPress={() => setIsShown(true)}>
            {t(K.show_again)}
          </Button>
        </div>
      )}
    </div>
  );
}
