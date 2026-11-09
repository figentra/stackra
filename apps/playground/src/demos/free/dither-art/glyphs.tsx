/**
 * Stackra file contract:
 * Purpose: the "glyphs" demo of the web DitherArt: the strata field drawn as code characters in the mono font, with
 *          the sun moved toward the inline end and a fade toward the bottom.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The art is
 *           decoration, so the caption says what it is. The glyphs never mirror; in right-to-left the sun moves to the
 *           other side. The poster is the kit's, served by the playground.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          brand rules §39 and §40; ADR 0060 (light, dark, RTL); STA-2041.
 */
import { DitherArt, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DITHER_ART_KEYS } from "#src/demos/free/dither-art/dither-art-keys.constant";

/** The demo's keys. */
const K = DITHER_ART_KEYS.dither_art.glyphs;

/** The kit's strata poster, one per scheme. */
const POSTER = { light: "/posters/strata-light.png", dark: "/posters/strata-dark.png" } as const;

/** DitherArt: Glyphs. */
export default function Glyphs() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <figure className="grid w-full gap-2">
      <DitherArt
        poster={POSTER}
        mode="glyphs"
        pixelSize={12}
        sun={{ x: 0.8, y: 0.9 }}
        mask="bottom"
        className="h-56 w-full"
      />
      <figcaption>
        <Text type="small" tone="muted">
          {t(K.caption)}
        </Text>
      </figcaption>
    </figure>
  );
}
