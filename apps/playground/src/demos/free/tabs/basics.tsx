/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Tabs: a tab list named for assistive technology, and one with no name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0313.
 */
import { Tabs, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { tabsSections } from "#src/demos/free/tabs/tabs-sections.function";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** A named and an unnamed tab list. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const sections = tabsSections(t);
  return (
    <div className="flex flex-wrap items-start gap-8">
      <Tabs items={sections} label={t(TABS_KEYS.tabs.basics.label)} />
      <Tabs items={sections} />
    </div>
  );
}
