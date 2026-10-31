/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Rating: in Arabic the first star is on the right and a half star fills from the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Rating, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RATING_KEYS } from "#src/demos/free/rating/rating-keys.constant";

/** The demo's keys. */
const K = RATING_KEYS.rating.arabic;

/** Rating: in Arabic the first star is on the right. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="grid gap-4">
      <Rating label={t(K.label)} defaultValue={2} />
      <Rating label={t(K.label)} value={3.5} isReadOnly />
    </div>
  );
}
