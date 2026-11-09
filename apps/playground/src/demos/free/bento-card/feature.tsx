/**
 * Stackra file contract:
 * Purpose: the "feature" demo of the web BentoCard: one feature card of a marketing bento grid, with a line, two pill
 *          links, a live meter at the bottom and the strata pattern behind it.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The links point
 *           back at this demo, so following one stays on the page. The poster is the kit's, served by the playground.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { BentoCard, ProgressBar, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { MESSAGES } from "#src/constants/messages.constant";
import { BENTO_CARD_KEYS } from "#src/demos/free/bento-card/bento-card-keys.constant";

/** The demo's keys. */
const K = BENTO_CARD_KEYS.bento_card.feature;

/** The kit's strata poster, one per scheme. */
const POSTER = { light: "/posters/strata-light.png", dark: "/posters/strata-dark.png" } as const;

/** BentoCard: Feature. */
export default function Feature() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#bento-card-feature`;
  return (
    <div className="w-full max-w-md">
      <BentoCard
        title={t(K.title)}
        description={t(K.description)}
        actions={[
          { id: "start", label: t(K.start), href: here, variant: "primary" },
          { id: "docs", label: t(K.docs), href: here },
        ]}
        art={{ poster: POSTER, pattern: "strata" }}
        mediaBleed="none"
        media={
          <ProgressBar
            value={36}
            maxValue={50}
            label={t(K.seats)}
            valueLabel={t(K.seats_value, { used: 36, total: 50 })}
            isLabelVisible
            isValueVisible
          />
        }
      />
    </div>
  );
}
