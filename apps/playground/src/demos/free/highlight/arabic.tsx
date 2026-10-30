/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Highlight: a search without marks finds a word written with them; the letters stay joined.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Highlight, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HIGHLIGHT_KEYS } from "#src/demos/free/highlight/highlight-keys.constant";

/** The demo's keys. */
const K = HIGHLIGHT_KEYS.highlight.arabic;

/** Highlight: a search without marks finds a word written with them; the letters stay joined. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <p className="m-0 text-lg">
        <Highlight query={t(K.query)}>{t(K.text)}</Highlight>
      </p>
    </div>
  );
}
