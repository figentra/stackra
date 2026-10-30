/**
 * Stackra file contract:
 * Purpose: the "review" demo of the web Truncate: a customer review clamped to two lines with Show more.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Truncate, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TRUNCATE_KEYS } from "#src/demos/free/truncate/truncate-keys.constant";

/** The demo's keys. */
const K = TRUNCATE_KEYS.truncate.review;

/** Truncate: a customer review clamped to two lines with Show more. */
export default function Review() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Truncate className="max-w-md" lines={2}>
      {t(K.text)}
    </Truncate>
  );
}
