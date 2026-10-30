/**
 * Stackra file contract:
 * Purpose: the "membership" demo of the web HoloCard: a loyalty card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { HoloCard, Stat, Surface, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HOLO_CARD_KEYS } from "#src/demos/free/holo-card/holo-card-keys.constant";

/** The demo's keys. */
const K = HOLO_CARD_KEYS.holo_card;

/** Holo card: a gold loyalty card; move the pointer over it. */
export default function Membership() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <HoloCard className="w-full max-w-sm">
      <div className="flex aspect-[1.6] flex-col justify-between bg-gradient-to-br from-warning/30 to-accent-soft p-5">
        {/* The words sit on plates of the surface, not on the gradient, so they read (and measure) on one ground. */}
        <Surface className="w-fit rounded-full px-3 py-1">
          <p className="m-0 text-sm font-semibold">{t(K.tier)}</p>
        </Surface>
        <Surface className="flex items-end justify-between gap-4 rounded-xl p-3">
          <div>
            <p className="m-0 text-lg font-semibold">{t(K.name)}</p>
            <p className="m-0 text-xs text-muted">{t(K.since)}</p>
          </div>
          <Stat label={t(K.points)} value={12_480} />
        </Surface>
      </div>
    </HoloCard>
  );
}
