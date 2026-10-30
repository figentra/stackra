/**
 * Stackra file contract:
 * Purpose: the "grid" demo of the web layout primitives: product cards that fit as many columns as 160px allows.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Grid, Surface, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_KEYS } from "#src/demos/free/layout/layout-keys.constant";

/** The demo's keys. */
const K = LAYOUT_KEYS.layout.grid;

/** Grid: as many columns as fit. */
export default function GridDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Grid minItemWidth={160} gap="sm" aria-label={t(K.label)} role="group" className="w-full">
      {[K.shirt, K.perfume, K.dates, K.abaya, K.coffee, K.mat].map((key) => (
        <Surface key={key} variant="secondary" className="grid h-24 place-items-center p-3 text-sm">
          {t(key)}
        </Surface>
      ))}
    </Grid>
  );
}
