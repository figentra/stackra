/**
 * Stackra file contract:
 * Purpose: the "search" demo of the web Highlight: customers matched as you type; Arabic matches without vowel marks.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Highlight, SearchField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HIGHLIGHT_KEYS } from "#src/demos/free/highlight/highlight-keys.constant";

/** The demo's keys. */
const K = HIGHLIGHT_KEYS.highlight.search;

/** Highlight: customers matched as you type; Arabic matches without vowel marks. */
export default function Search() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState(t(K.query));
  const rows = [K.r1, K.r2, K.r3, K.r4];
  return (
    <div className="grid w-full max-w-md gap-3">
      <SearchField label={t(K.label)} value={query} onChange={setQuery} />
      <ul className="m-0 grid list-none gap-1 p-0">
        {rows.map((key) => (
          <li key={key}>
            <Highlight query={query}>{t(key)}</Highlight>
          </li>
        ))}
      </ul>
    </div>
  );
}
