/**
 * Stackra file contract:
 * Purpose: the "terms" demo of the web Highlight: two terms marked in one sentence.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Highlight, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HIGHLIGHT_KEYS } from "#src/demos/free/highlight/highlight-keys.constant";

/** The demo's keys. */
const K = HIGHLIGHT_KEYS.highlight.terms;

/** Highlight: two terms marked in one sentence. */
export default function Terms() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <p className="m-0 max-w-md">
      <Highlight query={[t(K.a), t(K.b)]}>{t(K.text)}</Highlight>
    </p>
  );
}
