/**
 * Stackra file contract:
 * Purpose: the "announcements" demo of the native Marquee: a thin bar of shop news moving slowly on an accent band.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Marquee, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MARQUEE_DEMO_KEYS } from "#src/demos/free/marquee/marquee-demo-keys.constant";

/** The demo's keys. */
const K = MARQUEE_DEMO_KEYS.demo_free.marquee.announcements;

/** The news, in order. */
const ITEMS = [K.item_1, K.item_2, K.item_3, K.item_4];

/** Marquee: Shop announcements. */
export default function Announcements() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Marquee label={t(K.label)} speed={30} className="bg-accent-soft px-3 py-1">
      {ITEMS.map((item) => (
        <Text key={item} type="small" className="text-accent-soft-foreground">
          {t(item)}
        </Text>
      ))}
    </Marquee>
  );
}
