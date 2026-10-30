/**
 * Stackra file contract:
 * Purpose: the "announcements" demo of the web Marquee: a thin bar of shop news (delivery, a new collection,
 *          returns, instalments) moving slowly on an accent band.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Marquee, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MARQUEE_KEYS } from "#src/demos/free/marquee/marquee-keys.constant";

/** The demo's keys. */
const K = MARQUEE_KEYS.marquee.announcements;

/** The news, in order. */
const ITEMS = [K.item_1, K.item_2, K.item_3, K.item_4];

/** Marquee: Shop announcements. */
export default function Announcements() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Marquee label={t(K.label)} speed={30} className="w-full max-w-2xl bg-accent-soft px-3 py-1">
      {ITEMS.map((item) => (
        <Text key={item} type="small" className="whitespace-nowrap text-accent-soft-foreground">
          {t(item)}
        </Text>
      ))}
    </Marquee>
  );
}
