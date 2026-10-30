/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Tabs: primary on the page, secondary on a card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0313.
 */
import { Surface, Tabs, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { tabsSections } from "#src/demos/free/tabs/tabs-sections.function";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demo's keys. */
const K = TABS_KEYS.tabs.variants;

/** Both variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  const sections = tabsSections(t);
  return (
    <div className="flex flex-wrap items-start gap-8">
      <Tabs items={sections} label={t(K.primary)} variant="primary" />
      <Surface variant="secondary" className="p-4">
        <Tabs items={sections} label={t(K.secondary)} variant="secondary" />
      </Surface>
    </div>
  );
}
