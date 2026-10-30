/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Truncate: an Arabic review keeps its letters joined at the cut.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Truncate, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TRUNCATE_KEYS } from "#src/demos/free/truncate/truncate-keys.constant";

/** The demo's keys. */
const K = TRUNCATE_KEYS.truncate.arabic;

/** Truncate: an Arabic review keeps its letters joined at the cut. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <Truncate lines={2}>{t(K.text)}</Truncate>
    </div>
  );
}
