/**
 * Stackra file contract:
 * Purpose: the "chips" demo of the web Scroll area: a row of category chips that scrolls sideways.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Chip, ScrollArea, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCROLL_AREA_KEYS } from "#src/demos/free/scroll-area/scroll-area-keys.constant";

/** The demo's keys. */
const K = SCROLL_AREA_KEYS.scroll_area.chips;

/** Scroll area: a row of category chips that scrolls sideways. */
export default function Chips() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ScrollArea className="w-full max-w-md" label={t(K.label)} orientation="horizontal">
      <div className="flex w-max gap-2 p-1">
        {[K.all, K.dates, K.coffee, K.perfume, K.abayas, K.spices, K.sweets, K.gifts].map((key) => (
          <Chip key={key} variant="soft">
            {t(key)}
          </Chip>
        ))}
      </div>
    </ScrollArea>
  );
}
