/**
 * Stackra file contract:
 * Purpose: the "profile" demo of the web HoverCard: a teammate's profile.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Avatar, HoverCard, Link, Stat, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HOVER_CARD_KEYS } from "#src/demos/free/hover-card/hover-card-keys.constant";

/** The demo's keys. */
const K = HOVER_CARD_KEYS.hover_card;

/** Hover card: hover or focus the name to preview the profile. */
export default function Profile() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <p className="m-0 text-sm">
      {t(K.lead, { name: "" })}
      <HoverCard label={t(K.label)} trigger={<Link href="#">{t(K.name)}</Link>}>
        <div className="flex flex-col gap-3 p-1">
          <div className="flex items-center gap-3">
            <Avatar name={t(K.name)} />
            <div>
              <p className="m-0 font-semibold">{t(K.name)}</p>
              <p className="m-0 text-xs text-muted">{t(K.role)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t(K.orders)} value={1284} />
            <Stat label={t(K.rating)} value="4.9" />
          </div>
        </div>
      </HoverCard>
    </p>
  );
}
