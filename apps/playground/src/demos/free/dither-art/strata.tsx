/**
 * Stackra file contract:
 * Purpose: the "strata" demo of the web DitherArt: the primary brand pattern in the theme's ground, steel and
 *          champagne core, over the kit's poster, drifting for under five seconds and then holding.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The art is
 *           decoration, so the caption says what it is. The poster is the kit's, served by the playground.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          brand rules §39 and §40; ADR 0060 (light, dark, RTL); STA-2041.
 */
import { DitherArt, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DITHER_ART_KEYS } from "#src/demos/free/dither-art/dither-art-keys.constant";

/** The demo's keys. */
const K = DITHER_ART_KEYS.dither_art.strata;

/** The kit's strata poster, one per scheme. */
const POSTER = { light: "/posters/strata-light.png", dark: "/posters/strata-dark.png" } as const;

/** The DitherArt demo: Strata. */
export default function Strata() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <figure className="grid w-full gap-2">
      <DitherArt poster={POSTER} pattern="strata" className="h-56 w-full" />
      <figcaption>
        <Text type="small" tone="muted">
          {t(K.caption)}
        </Text>
      </figcaption>
    </figure>
  );
}
