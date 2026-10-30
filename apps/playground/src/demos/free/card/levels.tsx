/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the web Card: One card per surface level. The transparent card drops the background
 *          and the shadow.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Card as UiCard, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CARD_KEYS } from "#src/demos/free/card/card-keys.constant";

/** The demo's keys. */
const K = CARD_KEYS.card;

/** Card: Levels. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SurfaceVariant.map((variant) => (
        <UiCard
          key={variant}
          variant={variant}
          className={variant === "transparent" ? "border border-border" : ""}
        >
          <UiCard.Header>
            <UiCard.Title>{t(K.level_title, { level: variant })}</UiCard.Title>
            <UiCard.Description>
              <bdi>{t(K.level_description)}</bdi>
            </UiCard.Description>
          </UiCard.Header>
          <UiCard.Content>
            <bdi>{t(K.level_content)}</bdi>
          </UiCard.Content>
        </UiCard>
      ))}
    </div>
  );
}
